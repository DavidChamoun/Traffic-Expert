// src/screens/AdvicePage.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { makePhoneCall } from '../utils/phone';
import useDoubleBackExit from '../utils/doubleBackService';

const steps = [
  { id: 1, title: 'Ensure Safety', desc: 'Check for injuries and move to a safe location if possible. Turn on hazard lights.', icon: 'safety-check' },
  { id: 2, title: 'Call Emergency Services', desc: 'Contact police (112) if there are injuries or significant damage.', icon: 'emergency' },
  { id: 3, title: 'Document the Scene', desc: 'Take photos of vehicles, license plates, damage, and the surrounding area.', icon: 'photo-camera' },
  { id: 4, title: 'Exchange Information', desc: "Get the other driver's name, contact, insurance, and vehicle details.", icon: 'contact-page' },
  { id: 5, title: 'Contact Expert', desc: 'Use this app to call a verified expert for immediate assistance.', icon: 'engineering' },
  { id: 6, title: 'File Report', desc: 'Report the accident to your insurance company within 24 hours.', icon: 'description' },
];

const contacts = [
  { name: 'Police Emergency', number: '112', icon: 'local-police', color: '#2B6CB0' },
  { name: 'Civil Defense', number: '125', icon: 'medical-services', color: '#38A169' },
  { name: 'Red Cross', number: '140', icon: 'emergency', color: '#E53E3E' },
];

const AdvicePage: React.FC = () => {

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = getStyles(isDark);

  useDoubleBackExit();


  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={styles.emergencyCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.emIconWrap}>
            <MaterialIcons name="warning-amber" size={20} color="#fff" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.emTitle}>Emergency Protocol</Text>
            <Text style={styles.emDesc}>Follow these steps immediately after an accident to ensure safety and proper documentation.</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 24 }} />

      <Text style={styles.sectionTitle}>Step-by-Step Guide</Text>
      <View style={{ height: 12 }} />
      {steps.map(s => (
        <View key={s.id} style={styles.stepCard}>
          <View style={styles.stepLeft}>
            <View style={styles.stepNum}>
              <Text style={{ color: isDark ? '#002fbdff' : '#102C7E', fontWeight: '700', fontFamily: 'Outfit-SemiBold' }}>{s.id}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name={s.icon as any} size={16} color={isDark ? '#002fbdff' : '#102C7E'} />
              <Text style={styles.stepTitle}>{s.title}</Text>
            </View>
            <Text style={styles.stepDesc}>{s.desc}</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 24 }} />

      <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      <View style={{ height: 12 }} />
      {contacts.map(c => (
        <TouchableOpacity key={c.number} style={styles.contactItem} onPress={() => makePhoneCall(c.number)}>
          <View style={[styles.contactIcon, { backgroundColor: `${c.color}10` }]}>
            <MaterialIcons name={c.icon as any} size={20} color={c.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactName}>{c.name}</Text>
            <Text style={styles.contactNumber}>{c.number}</Text>
          </View>
          <View style={[styles.callPill, { backgroundColor: `${c.color}10` }]}>
            <Text style={{ color: c.color, fontWeight: '600', fontFamily: 'Outfit-Medium' }}>Call</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default AdvicePage;

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: isDark ? '#0A0A0F' : '#fff',
  },
  spacingSmall: {
    height: 12,
  },
  spacingMedium: {
    height: 24,
  },
  spacingLarge: {
    height: 32,
  },
  
  // Emergency Card
  emergencyCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: isDark ? '#DC2626' : '#FF6B6B',
    shadowColor: isDark ? '#DC2626' : '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emIconWrap: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emTitle: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 18, 
    fontFamily: 'Outfit-SemiBold' 
  },
  emDesc: { 
    color: 'rgba(255,255,255,0.95)', 
    marginTop: 6, 
    lineHeight: 20, 
    fontSize: 14, 
    fontFamily: 'Outfit-Regular' 
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(16,44,126,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: isDark ? '#F7FAFC' : '#2D3748', 
    fontFamily: 'Outfit-SemiBold'
  },

  // Step Cards
  stepCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: isDark ? '#1A1A24' : '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? '#2D2D3A' : '#E2E8F0',
    flexDirection: 'row',
    shadowColor: isDark ? '#8B5CF6' : '#000',
    shadowOpacity: isDark ? 0.1 : 0.05,
    shadowRadius: 6,
    elevation: isDark ? 0 : 2,
  },
  stepLeft: { 
    width: 40, 
    alignItems: 'center', 
    justifyContent: 'flex-start' 
  },
  stepNum: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(16,44,126,0.06)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  stepNumText: { 
    color: isDark ? '#8B5CF6' : '#102C7E', 
    fontWeight: '700', 
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold' 
  },
  stepTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepTitle: { 
    marginLeft: 10, 
    fontSize: 16, 
    fontWeight: '600', 
    color: isDark ? '#F7FAFC' : '#2D3748', 
    fontFamily: 'Outfit-Medium' 
  },
  stepDesc: { 
    fontSize: 14, 
    color: isDark ? '#94A3B8' : '#718096', 
    lineHeight: 20, 
    fontFamily: 'Outfit-Regular' 
  },

  // Emergency Contacts
  contactItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: isDark ? '#1A1A24' : '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? '#2D2D3A' : 'transparent',
  },
  contactIcon: { 
    width: 52, 
    height: 52, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  contactName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: isDark ? '#F7FAFC' : '#2D3748', 
    fontFamily: 'Outfit-Medium' 
  },
  contactNumber: { 
    color: isDark ? '#94A3B8' : '#718096', 
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'Outfit-Regular' 
  },
  callPill: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    marginLeft: 8,
  },
  callText: {
    fontWeight: '600', 
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
  },

  // Tip Card
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#FCD34D',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#FBBF24' : '#D97706',
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: isDark ? '#94A3B8' : '#4B5563',
    fontFamily: 'Outfit-Regular',
    lineHeight: 20,
  },
});