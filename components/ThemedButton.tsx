import React from 'react';
import { 
  Pressable, 
  PressableProps, 
  StyleSheet, 
  Text, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useActiveTheme } from '@/store/themeStore';

interface ThemedButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  buttonStyle,
  textStyle,
  ...props
}) => {
  const theme = useActiveTheme();
  
  // Determine button styles based on variant
  let buttonVariantStyle: ViewStyle = {};
  let textVariantStyle: TextStyle = {};
  
  switch (variant) {
    case 'primary':
      buttonVariantStyle = {
        backgroundColor: theme.colors.primary,
      };
      textVariantStyle = {
        color: '#FFFFFF',
      };
      break;
    case 'secondary':
      buttonVariantStyle = {
        backgroundColor: theme.colors.backgroundSecondary,
      };
      textVariantStyle = {
        color: theme.colors.text,
      };
      break;
    case 'outline':
      buttonVariantStyle = {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      };
      textVariantStyle = {
        color: theme.colors.primary,
      };
      break;
    case 'ghost':
      buttonVariantStyle = {
        backgroundColor: 'transparent',
      };
      textVariantStyle = {
        color: theme.colors.primary,
      };
      break;
  }
  
  // Determine button size
  let sizeStyle: ViewStyle = {};
  let textSizeStyle: TextStyle = {};
  
  switch (size) {
    case 'small':
      sizeStyle = {
        height: 36,
        paddingHorizontal: 16,
      };
      textSizeStyle = {
        fontSize: 14,
      };
      break;
    case 'medium':
      sizeStyle = {
        height: 48,
        paddingHorizontal: 24,
      };
      textSizeStyle = {
        fontSize: 16,
      };
      break;
    case 'large':
      sizeStyle = {
        height: 56,
        paddingHorizontal: 32,
      };
      textSizeStyle = {
        fontSize: 18,
      };
      break;
  }
  
  // Disabled state
  const disabledStyle: ViewStyle = (disabled || isLoading) ? {
    opacity: 0.6,
  } : {};
  
  return (
    <Pressable
      style={[
        styles.button,
        buttonVariantStyle,
        sizeStyle,
        disabledStyle,
        buttonStyle,
      ]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={textVariantStyle.color} 
          size="small" 
        />
      ) : (
        <>
          {leftIcon && <span style={styles.leftIcon}>{leftIcon}</span>}
          <Text 
            style={[
              styles.text,
              textVariantStyle,
              textSizeStyle,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <span style={styles.rightIcon}>{rightIcon}</span>}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 8,
  },
  text: {
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});