import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { captureException } from '@/lib/monitoring';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

// App-wide safety net: catches render-time errors, reports them, and shows a
// gentle recovery screen instead of a white crash.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, { componentStack: info.componentStack });
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          We hit an unexpected error. Your memories are safe — please try again.
        </Text>
        <Pressable style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  body: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  button: {
    backgroundColor: '#B24592',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
