/**
 * Script to generate an audit report of SUPER_ADMIN user activities
 * This helps monitor high-privilege actions in the system
 */
const { pool } = require('../server/db');
const { drizzle } = require('drizzle-orm/node-postgres');
const fs = require('fs');
const path = require('path');
const { eq, and, or, desc, sql } = require('drizzle-orm');

async function generateSuperAdminAuditReport(days = 30) {
  // Connect to the database
  const db = drizzle(pool);

  // Import schema definitions
  const { system_logs, users } = require('../shared/src/schema');

  console.log(`Generating SUPER_ADMIN audit report for the last ${days} days...`);

  try {
    // Get all SUPER_ADMIN users
    const superAdminUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email
      })
      .from(users)
      .where(eq(users.role, 'SUPER_ADMIN'));

    if (superAdminUsers.length === 0) {
      console.log('No SUPER_ADMIN users found in the system.');
      return;
    }

    console.log(`Found ${superAdminUsers.length} SUPER_ADMIN users.`);

    // Get the IDs of all SUPER_ADMIN users
    const superAdminIds = superAdminUsers.map(user => user.id);

    // Calculate the date range (last N days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Query system logs for SUPER_ADMIN activities
    const logs = await db
      .select({
        id: system_logs.id,
        userId: system_logs.user_id,
        action: system_logs.action,
        details: system_logs.details,
        ip: system_logs.ip_address,
        userAgent: system_logs.user_agent,
        timestamp: system_logs.timestamp,
        resourceType: system_logs.resource_type,
        resourceId: system_logs.resource_id
      })
      .from(system_logs)
      .where(
        and(
          // Filter for SUPER_ADMIN users
          inArray(system_logs.user_id, superAdminIds),
          // Filter for date range
          between(
            system_logs.timestamp,
            sql`${startDate.toISOString()}::timestamp`,
            sql`${endDate.toISOString()}::timestamp`
          )
        )
      )
      .orderBy(desc(system_logs.timestamp));

    console.log(`Found ${logs.length} SUPER_ADMIN activities in the last ${days} days.`);

    // Create user lookup map for quicker access
    const userMap = superAdminUsers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    // Generate the report
    const report = {
      generated: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalSuperAdmins: superAdminUsers.length,
        totalActivities: logs.length
      },
      superAdmins: superAdminUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email
      })),
      activities: logs.map(log => ({
        timestamp: log.timestamp,
        user: userMap[log.userId]?.username || `Unknown (ID: ${log.userId})`,
        action: log.action,
        resource: `${log.resourceType}${log.resourceId ? ` (ID: ${log.resourceId})` : ''}`,
        details: log.details,
        ip: log.ip,
        userAgent: log.userAgent
      }))
    };

    // Create the reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Write the report to a JSON file
    const filename = path.join(reportsDir, `super-admin-audit-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));

    console.log(`Super admin audit report generated successfully: ${filename}`);

    // Print summary to console
    console.log('\nSUMMARY:');
    console.log(`Total SUPER_ADMIN users: ${report.summary.totalSuperAdmins}`);
    console.log(`Total activities: ${report.summary.totalActivities}`);
    console.log('\nTop actions:');
    
    // Count activities by action
    const actionCounts = {};
    for (const activity of report.activities) {
      actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1;
    }
    
    // Sort and display top 5 actions
    Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([action, count]) => {
        console.log(`  ${action}: ${count} times`);
      });

  } catch (error) {
    console.error('Error generating SUPER_ADMIN audit report:', error);
  }

  // Close the database connection
  await pool.end();
}

// Helper functions that may not be directly available in drizzle-orm
function inArray(column, values) {
  return sql`${column} = ANY(ARRAY[${values}]::int[])`;
}

function between(column, start, end) {
  return sql`${column} BETWEEN ${start} AND ${end}`;
}

// Check command line arguments
const args = process.argv.slice(2);
const days = args.length > 0 ? parseInt(args[0]) : 30;

// Run the script
generateSuperAdminAuditReport(days).catch(error => {
  console.error('Error running audit report generator:', error);
  process.exit(1);
});
