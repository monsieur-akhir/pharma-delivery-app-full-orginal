import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle';
  opacity: Animated.Value;
}

interface AdherenceCelebrationProps {
  streakDays: number;
  adherencePercentage: number;
  onClose: () => void;
}

// Random color generator for confetti
const getRandomColor = () => {
  const colors = ['#FF5733', '#4CD964', '#FF9500', '#4CA6FF', '#D94CFF', '#FFCC00'];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * A celebration animation that shows when user achieves good medication adherence
 */
const AdherenceCelebration: React.FC<AdherenceCelebrationProps> = ({
  streakDays,
  adherencePercentage,
  onClose,
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  // Animation values for the main content
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Initialize confetti animation on component mount
  useEffect(() => {
    // Create confetti pieces
    const pieces: ConfettiPiece[] = [];
    const confettiCount = 50; // Number of confetti pieces
    
    for (let i = 0; i < confettiCount; i++) {
      pieces.push({
        id: i,
        x: new Animated.Value(screenWidth / 2),
        y: new Animated.Value(-20),
        rotate: new Animated.Value(0),
        color: getRandomColor() || '#4CAF50',
        size: Math.random() * 8 + 6, // Random size between 6 and 14
        shape: Math.random() < 0.33 ? 'circle' : (Math.random() < 0.5 ? 'square' : 'triangle'),
        opacity: new Animated.Value(1),
      });
    }
    
    setConfetti(pieces);
    
    // Start the entrance animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animate each confetti piece
    pieces.forEach(piece => {
      const duration = Math.random() * 2000 + 2000; // Random duration between 2-4 seconds
      const targetX = Math.random() * screenWidth;
      const targetY = Math.random() * screenHeight * 0.7 + 100;
      
      Animated.parallel([
        Animated.timing(piece.x, {
          toValue: targetX,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(piece.y, {
          toValue: targetY,
          duration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotate, {
          toValue: Math.random() * 8, // Random rotation (will be multiplied by 360 in transform)
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.7),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, []);
  
  // Handle the close animation
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };
  
  // Determine achievement message based on streak and adherence
  const getAchievementMessage = () => {
    if (streakDays >= 30 && adherencePercentage >= 95) {
      return 'Incredible Achievement!';
    } else if (streakDays >= 14 && adherencePercentage >= 90) {
      return 'Fantastic Progress!';
    } else if (streakDays >= 7 && adherencePercentage >= 85) {
      return 'Great Job!';
    } else {
      return 'Keep Going!';
    }
  };
  
  // Determine achievement description based on streak and adherence
  const getAchievementDescription = () => {
    if (streakDays >= 30) {
      return `You've maintained a ${Math.round(adherencePercentage)}% adherence rate for a full month!`;
    } else if (streakDays >= 14) {
      return `You've stayed on track with your medication for 2 weeks straight!`;
    } else if (streakDays >= 7) {
      return `You've completed a full week of medication adherence!`;
    } else {
      return `You've maintained ${Math.round(adherencePercentage)}% adherence to your medication schedule!`;
    }
  };
  
  // Render each confetti piece
  const renderConfetti = () => {
    return confetti.map(piece => {
      const rotate = piece.rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });
      
      // Different shapes for confetti
      let shapeStyle;
      if (piece.shape === 'circle') {
        shapeStyle = { borderRadius: piece.size / 2 };
      } else if (piece.shape === 'triangle') {
        // Note: Triangles are approximated using borders in this simple example
        shapeStyle = {
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid',
          borderLeftWidth: piece.size / 2,
          borderRightWidth: piece.size / 2,
          borderBottomWidth: piece.size,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: piece.color,
        };
      }
      
      return (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                { rotate: rotate },
              ],
              opacity: piece.opacity,
            },
            shapeStyle,
          ]}
        />
      );
    });
  };
  
  return (
    <View style={styles.container}>
      {renderConfetti()}
      
      <Animated.View
        style={[
          styles.celebrationCard,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>{getAchievementMessage()}</Text>
          <Text style={styles.description}>{getAchievementDescription()}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(adherencePercentage)}%</Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
  },
  celebrationCard: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1001,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CD964',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: '#4CD964',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdherenceCelebration;