import React, { useEffect, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: Animated.Value;
  fall: Animated.Value;
}

interface AdherenceCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const AdherenceCelebration: React.FC<AdherenceCelebrationProps> = ({
  isVisible,
  onComplete,
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

  const getRandomColor = (): string => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createConfettiPiece = (id: number): ConfettiPiece => {
    return {
      id,
      x: Math.random() * width,
      y: -50,
      color: getRandomColor(),
      size: Math.random() * 8 + 4,
      rotation: new Animated.Value(0),
      fall: new Animated.Value(0),
    };
  };

  useEffect(() => {
    if (isVisible) {
      // Create confetti pieces
      const pieces = Array.from({ length: 50 }, (_, index) => createConfettiPiece(index));
      setConfetti(pieces);

      // Animate confetti
      const animations = pieces.map((piece) => {
        return Animated.parallel([
          Animated.timing(piece.fall, {
            toValue: height + 100,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(piece.rotation, {
              toValue: 1,
              duration: 1000 + Math.random() * 1000,
              useNativeDriver: true,
            })
          ),
        ]);
      });

      Animated.stagger(100, animations).start(() => {
        if (onComplete) {
          onComplete();
        }
      });

      // Clean up after animation
      const timeout = setTimeout(() => {
        setConfetti([]);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  if (!isVisible || confetti.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {confetti.map((piece) => {
        const translateY = piece.fall.interpolate({
          inputRange: [0, height + 100],
          outputRange: [piece.y, height + 100],
        });

        const rotate = piece.rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        const shapeStyle = {
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          borderStyle: 'solid' as const,
          borderLeftWidth: piece.size / 2,
          borderRightWidth: piece.size / 2,
          borderBottomWidth: piece.size,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: piece.color,
        };

        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.confettiPiece,
              {
                left: piece.x,
                transform: [
                  { translateY },
                  { rotate },
                ],
              },
            ]}
          >
            <View style={shapeStyle} />
          </Animated.View>
        );
      })}
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
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
  },
});

export default AdherenceCelebration;