import { Linking, Alert, Platform } from 'react-native';

// export async function makePhoneCall(number: string) {
//   const url = `tel:${number}`;

//   try {
//     const supported = await Linking.canOpenURL(url);

//     if (!supported) {
//       Alert.alert(
//         'Not Supported',
//         'This device cannot make phone calls.'
//       );
//       return;
//     }

//     await Linking.openURL(url);
//   } catch (error) {
//     console.warn('Call error:', error);
//     Alert.alert('Error', 'Unable to open phone dialer.');
//   }
// }

export async function makePhoneCall(number: string) {
  const url = `tel:${number}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'Unable to open phone dialer.');
    console.warn('Call error:', error);
  }
}
