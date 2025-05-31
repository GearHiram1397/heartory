import React from 'react';
import { StyleSheet, Text, Pressable, ActivityIndicator, PressableProps } from 'react-native';
import { colors } from '@/constants/colors';

interface AuthButtonProps extends PressableProps {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  isLoading = false,
  variant = 'primary',
  disabled,
  ...props
}) => {
  const isPrimary = variant === 'primary';
  
  return (
    <Pressable
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        (disabled || isLoading) && styles.disabledButton,
      ]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={isPrimary ? '#fff' : colors.rosewood} 
          size="small" 
        />
      ) : (
        <Text 
          style={[
            styles.buttonText,
            isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: colors.rosewood,
  },
  secondaryButton: {
    backgroundColor: colors.backgroundDark,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: colors.text,
  },
});