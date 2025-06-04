import { Injectable, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService implements OnModuleInit {
  private openai: OpenAI;
  private useOpenAI: boolean;

  constructor() {
    // Par défaut, nous utilisons des données simulées pour éviter les problèmes de quota
    this.useOpenAI = false;
  }

  onModuleInit() {
    if (process.env.OPENAI_API_KEY && process.env.USE_OPENAI_API === 'true') {
      this.useOpenAI = true;
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('OpenAI service initialized with API key - LIVE MODE');
    } else {
      this.useOpenAI = false;
      console.log('Using demonstration data for API responses - DEMO MODE');
    }
  }

  /**
   * Analyzes a prescription image using OpenAI's Vision model
   * @param imageBase64 Base64 encoded image data
   * @returns Analysis results including medicines, dosages, and instructions
   */
  async analyzePrescriptionImage(imageBase64: string): Promise<any> {
    try {
      if (this.useOpenAI) {
        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a pharmaceutical expert specializing in prescription analysis. Extract and analyze the information from the prescription image, including drug names, dosages, frequencies, durations, and any special instructions. Format your response as structured JSON."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this prescription image and extract the medicines, dosages, and instructions. Structure your response as JSON with the following format: { medications: [{ name: string, dosage: string, frequency: string, duration: string, instructions: string }], patientInfo: { name: string, age: string, gender: string }, doctorInfo: { name: string, credentials: string }, additionalNotes: string }"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Data}`
                  }
                }
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000,
        });

        return JSON.parse(response.choices[0].message.content);
      } else {
        // Return mock data for demonstration
        return {
          medications: [
            {
              name: "Metformin",
              dosage: "500mg",
              frequency: "Twice daily",
              duration: "3 months",
              instructions: "Take with meals"
            },
            {
              name: "Lisinopril",
              dosage: "10mg",
              frequency: "Once daily",
              duration: "Ongoing",
              instructions: "Take in the morning"
            }
          ],
          patientInfo: {
            name: "John Doe",
            age: "45",
            gender: "Male"
          },
          doctorInfo: {
            name: "Dr. Jane Smith",
            credentials: "MD, Internal Medicine"
          },
          additionalNotes: "Follow up in 3 months. Monitor blood pressure weekly."
        };
      }
    } catch (error) {
      console.error('Error analyzing prescription:', error);
      throw new Error(`Failed to analyze prescription: ${error.message}`);
    }
  }

  /**
   * Provides guidance on drug interactions for a list of medications
   * @param medications Array of medication names
   * @returns Analysis of potential drug interactions and warnings
   */
  async checkDrugInteractions(medications: string[]): Promise<any> {
    try {
      if (this.useOpenAI) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [
            {
              role: "system",
              content: "You are a pharmaceutical expert specializing in drug interactions. Analyze the list of medications provided and identify potential interactions, side effects, and precautions. Format your response as structured JSON."
            },
            {
              role: "user",
              content: `Analyze these medications for potential interactions: ${medications.join(', ')}. Structure your response as JSON with the following format: { interactions: [{ drugs: string[], severity: string, description: string, recommendation: string }], generalPrecautions: string }`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000,
        });

        return JSON.parse(response.choices[0].message.content);
      } else {
        // Return mock data for demonstration
        return {
          interactions: [
            {
              drugs: ["Metformin", "Ibuprofen"],
              severity: "Moderate",
              description: "May increase the risk of lactic acidosis",
              recommendation: "Monitor closely if both drugs must be used together"
            }
          ],
          generalPrecautions: "Always consult with your healthcare provider or pharmacist before combining medications."
        };
      }
    } catch (error) {
      console.error('Error checking drug interactions:', error);
      throw new Error(`Failed to check drug interactions: ${error.message}`);
    }
  }

  /**
   * Provides medication information and usage guidance
   * @param medicationName Name of the medication
   * @returns Detailed information about the medication
   */
  async getMedicationInfo(medicationName: string): Promise<any> {
    try {
      if (this.useOpenAI) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [
            {
              role: "system",
              content: "You are a pharmaceutical expert with extensive knowledge of medications. Provide detailed, accurate information about medications, including uses, side effects, precautions, and proper administration. Format your response as structured JSON."
            },
            {
              role: "user",
              content: `Provide detailed information about ${medicationName}. Structure your response as JSON with the following format: { name: string, category: string, uses: string[], sideEffects: { common: string[], severe: string[] }, precautions: string[], properUsage: string, storage: string }`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000,
        });

        return JSON.parse(response.choices[0].message.content);
      } else {
        // Return mock data for demonstration
        // Customize based on the medication name
        if (medicationName.toLowerCase().includes('metformin')) {
          return {
            name: "Metformin",
            category: "Biguanide Antidiabetic",
            uses: [
              "Type 2 diabetes management",
              "Insulin resistance",
              "Polycystic ovary syndrome (PCOS)"
            ],
            sideEffects: {
              common: [
                "Nausea",
                "Diarrhea",
                "Stomach upset",
                "Metallic taste"
              ],
              severe: [
                "Lactic acidosis (rare but serious)",
                "Vitamin B12 deficiency with long-term use",
                "Hypoglycemia (when combined with other diabetes medications)"
              ]
            },
            precautions: [
              "Not recommended for patients with kidney disease",
              "Should be temporarily discontinued before procedures using contrast dye",
              "Avoid excessive alcohol consumption",
              "Use caution in elderly patients"
            ],
            properUsage: "Take with meals to reduce gastrointestinal side effects. Start with a low dose and gradually increase as tolerated.",
            storage: "Store at room temperature away from moisture and heat."
          };
        } else {
          return {
            name: medicationName,
            category: "Prescription Medication",
            uses: [
              "Treatment of medical conditions as prescribed by healthcare provider"
            ],
            sideEffects: {
              common: [
                "Varies depending on medication type",
                "May include headache",
                "Nausea",
                "Dizziness"
              ],
              severe: [
                "Always consult medication guide for potential severe side effects",
                "Contact healthcare provider if experiencing unusual symptoms"
              ]
            },
            precautions: [
              "Take as prescribed by healthcare provider",
              "Inform provider of all other medications you're taking",
              "Discuss any allergies or medical conditions before starting"
            ],
            properUsage: "Follow healthcare provider's instructions carefully. Do not adjust dosage without consulting your provider.",
            storage: "Store at room temperature away from moisture and heat unless otherwise directed."
          };
        }
      }
    } catch (error) {
      console.error('Error fetching medication info:', error);
      throw new Error(`Failed to get medication information: ${error.message}`);
    }
  }
}