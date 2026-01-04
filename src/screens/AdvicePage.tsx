// src/screens/AdvicePage.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { makePhoneCall } from '../utils/phone';

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
              <Text style={{ color: '#102C7E', fontWeight: '700', fontFamily: 'Outfit-SemiBold' }}>{s.id}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name={s.icon as any} size={16} color="#102C7E" />
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

const styles = StyleSheet.create({
  emergencyCard: {
    padding: 20,
    borderRadius: 16,
    // backgroundColor: 'linear-gradient(180deg, #FF6B6B, #EE5A52)', // RN doesn't support CSS gradients in styles; keep for reference
    elevation: 6,
    // We'll fallback to solid color:
    backgroundColor: '#FF6B6B',
  },
  emIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  emTitle: { color: '#fff', fontWeight: '700', fontSize: 18, fontFamily: 'Outfit-SemiBold' },
  emDesc: { color: 'rgba(255,255,255,0.9)', marginTop: 8, lineHeight: 20, fontSize: 14, fontFamily: 'Outfit-Regular' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748', fontFamily: 'Outfit-SemiBold'},

  stepCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  stepLeft: { width: 40, alignItems: 'center', justifyContent: 'center' },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16,44,126,0.06)', alignItems: 'center', justifyContent: 'center' },
  stepTitle: { marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#2D3748', fontFamily: 'Outfit-Medium', },
  stepDesc: { marginTop: 6, fontSize: 14, color: '#718096', lineHeight: 18, fontFamily: 'Outfit-Regular', },

  contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  contactIcon: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#2D3748', fontFamily: 'Outfit-Medium', },
  contactNumber: { color: '#718096', fontFamily: 'Outfit-Regular', },
  callPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
});
