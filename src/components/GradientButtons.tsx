// src/components/GradientButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


type Props = {
  text: string;
  onPress: () => void;
  style?: ViewStyle;
  icon?: string;
};

const GradientButton: React.FC<Props> = ({ text, onPress, style, icon }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
      <LinearGradient
        colors={['#102C7E', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.row}>
          {/* {icon ? <Text style={styles.icon}>{icon}</Text> : null} */}
          {icon ? <MaterialIcons name={icon} style={styles.icon} /> : null }
          <Text style={styles.text}>{text}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default GradientButton;

const styles = StyleSheet.create({
  gradient: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 18, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: 12, fontSize: 20, color: '#764BA2' },
});
