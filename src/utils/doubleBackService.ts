import { BackHandler, ToastAndroid } from 'react-native';
import { useEffect, useRef } from 'react';

const useDoubleBackExit = () => {
  const backPressCount = useRef(0);

  useEffect(() => {
    const onBackPress = () => {
      if (backPressCount.current === 0) {
        backPressCount.current += 1;

        ToastAndroid.show(
          'Press again to exit',
          ToastAndroid.SHORT
        );

        setTimeout(() => {
          backPressCount.current = 0;
        }, 2000); // reset after 2 seconds

        return true; // block default behavior
      }

      BackHandler.exitApp();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => subscription.remove();
  }, []);
};

export default useDoubleBackExit;
