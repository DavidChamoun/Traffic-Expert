// src/utils/phone.ts
import { Linking, Alert } from 'react-native';

export function makePhoneCall(number: string) {
  const url = `tel:${number}`;
  Linking.canOpenURL(url).then(supported => {
    if (!supported) {
      Alert.alert('Error', 'Phone calls not supported on this device');
    } else {
      return Linking.openURL(url);
    }
  }).catch(err => {
    console.warn('Error opening URL', err);
    Alert.alert('Error', 'Unable to make call');
  });
}
