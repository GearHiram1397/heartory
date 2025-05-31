import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
  FlatList
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Mail, Plus, X, Share2, Copy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';

export default function InviteScreen() {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const { 
    referralInfo, 
    fetchReferralInfo,
    inviteFriend,
    isLoading, 
    error, 
    clearError 
  } = useSubscriptionStore();
  
  const router = useRouter();
  const theme = useActiveTheme();
  
  useEffect(() => {
    fetchReferralInfo();
  }, []);
  
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const handleAddEmail = () => {
    if (!currentEmail.trim()) {
      setEmailError('Please enter an email address');
      return;
    }
    
    if (!validateEmail(currentEmail.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (emails.includes(currentEmail.trim())) {
      setEmailError('This email has already been added');
      return;
    }
    
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    
    setEmails([...emails, currentEmail.trim()]);
    setCurrentEmail('');
    setEmailError('');
  };
  
  const handleRemoveEmail = (email: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    
    setEmails(emails.filter(e => e !== email));
  };
  
  const handleSendInvites = async () => {
    if (emails.length === 0) {
      Alert.alert('Error', 'Please add at least one email address');
      return;
    }
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setIsSending(true);
    clearError();
    
    try {
      // Send invites to each email
      for (const email of emails) {
        await inviteFriend(email);
      }
      
      Alert.alert('Success', 'Invitations sent successfully!');
      setEmails([]);
      router.back();
    } catch (error) {
      // Error is handled in the store
    } finally {
      setIsSending(false);
    }
  };
  
  const handleCopyCode = async () => {
    if (!referralInfo?.code) return;
    
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    
    try {
      await Clipboard.setStringAsync(referralInfo.code);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };
  
  const handleShareCode = async () => {
    if (!referralInfo?.referralLink) return;
    
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    
    try {
      await Share.share({
        message: `Join me on Memora, a beautiful app for preserving memories! Use my referral code ${referralInfo.code} to get a free month. ${referralInfo.referralLink}`,
        url: referralInfo.referralLink,
        title: 'Join me on Memora'
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };
  
  const renderEmailItem = ({ item }: { item: string }) => (
    <View style={[styles.emailChip, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ThemedText style={styles.emailChipText}>{item}</ThemedText>
      <TouchableOpacity 
        onPress={() => handleRemoveEmail(item)}
        style={styles.removeButton}
      >
        <X size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Invite Friends',
          }} 
        />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.error}20` }]}>
              <ThemedText style={{ color: theme.colors.error }}>{error}</ThemedText>
            </View>
          )}
          
          <ThemedText preset="title">Invite Friends to Memora</ThemedText>
          <ThemedText variant="secondary" style={styles.subtitle}>
            Share Memora with friends and family. When they join using your referral code, you'll both get one month free!
          </ThemedText>
          
          {referralInfo && (
            <ThemedCard style={styles.referralCard}>
              <ThemedText preset="subtitle">Your Referral Code</ThemedText>
              <View style={styles.codeContainer}>
                <View style={[styles.codeBox, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <ThemedText style={styles.codeText}>{referralInfo.code}</ThemedText>
                  <TouchableOpacity onPress={handleCopyCode} style={styles.iconButton}>
                    <Copy size={18} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  onPress={handleShareCode} 
                  style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
                >
                  <Share2 size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>{referralInfo.referralsCount}</ThemedText>
                  <ThemedText variant="secondary" style={styles.statLabel}>Friends joined</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>{referralInfo.freeMonthsEarned}</ThemedText>
                  <ThemedText variant="secondary" style={styles.statLabel}>Free months earned</ThemedText>
                </View>
              </View>
            </ThemedCard>
          )}
          
          <View style={styles.inviteSection}>
            <ThemedText preset="subtitle">Send Email Invitations</ThemedText>
            
            <View style={styles.emailInputContainer}>
              <View style={[
                styles.inputContainer,
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: emailError ? theme.colors.error : 'transparent',
                },
                emailError ? styles.inputError : null
              ]}>
                <View style={styles.iconContainer}>
                  <Mail size={20} color={theme.colors.textSecondary} />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text }
                  ]}
                  value={currentEmail}
                  onChangeText={(text) => {
                    setCurrentEmail(text);
                    if (text.trim()) setEmailError('');
                  }}
                  placeholder="Enter email address"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleAddEmail}
                />
                <TouchableOpacity 
                  onPress={handleAddEmail}
                  style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                >
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {emailError ? (
                <ThemedText style={{ color: theme.colors.error, fontSize: 14, marginTop: 4 }}>
                  {emailError}
                </ThemedText>
              ) : null}
            </View>
            
            {emails.length > 0 && (
              <View style={styles.emailsContainer}>
                <ThemedText preset="label">Recipients</ThemedText>
                <FlatList
                  data={emails}
                  renderItem={renderEmailItem}
                  keyExtractor={(item) => item}
                  horizontal={false}
                  numColumns={2}
                  contentContainerStyle={styles.emailsList}
                />
              </View>
            )}
            
            <ThemedButton
              title="Send Invitations"
              onPress={handleSendInvites}
              isLoading={isSending}
              disabled={emails.length === 0}
              leftIcon={<Mail size={18} color="#FFFFFF" />}
            />
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  referralCard: {
    padding: 16,
    marginBottom: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  codeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  codeText: {
    fontWeight: '600',
    letterSpacing: 1,
  },
  iconButton: {
    padding: 4,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  inviteSection: {
    marginTop: 8,
  },
  emailInputContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 20,
  },
  emailsContainer: {
    marginBottom: 24,
  },
  emailsList: {
    marginTop: 8,
  },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  emailChipText: {
    fontSize: 14,
    marginRight: 8,
  },
  removeButton: {
    padding: 2,
  },
});