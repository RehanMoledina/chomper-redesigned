import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { apiRequest } from '@/lib/queryClient';

interface PushNotificationState {
  isNative: boolean;
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isNative: Capacitor.isNativePlatform(),
    isSupported: false,
    isRegistered: false,
    token: null,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setState(prev => ({ ...prev, isSupported: 'PushManager' in window }));
      return;
    }

    const checkPermissions = async () => {
      try {
        const result = await PushNotifications.checkPermissions();
        setState(prev => ({
          ...prev,
          isSupported: true,
          isRegistered: result.receive === 'granted',
        }));
      } catch (error) {
        console.error('Error checking push permissions:', error);
      }
    };

    checkPermissions();

    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success:', token.value);
      setState(prev => ({ ...prev, isRegistered: true, token: token.value }));
      
      const platform = Capacitor.getPlatform() as 'android' | 'ios';
      try {
        await apiRequest('POST', '/api/device-token', {
          token: token.value,
          platform,
        });
      } catch (error) {
        console.error('Error saving device token:', error);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      setState(prev => ({ ...prev, isRegistered: false }));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
      window.location.href = notification.notification.data?.url || '/';
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  const registerForPush = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }

      await PushNotifications.register();
      return true;
    } catch (error) {
      console.error('Error registering for push:', error);
      return false;
    }
  }, []);

  const unregisterFromPush = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform() || !state.token) {
      return false;
    }

    try {
      await apiRequest('DELETE', '/api/device-token', { token: state.token });
      setState(prev => ({ ...prev, isRegistered: false, token: null }));
      return true;
    } catch (error) {
      console.error('Error unregistering from push:', error);
      return false;
    }
  }, [state.token]);

  return {
    ...state,
    registerForPush,
    unregisterFromPush,
  };
}
