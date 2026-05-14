import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SnapScreen from './src/screens/SnapScreen';
import { useAuthStore } from './src/store/authStore';
import { registerForPushNotifications } from './src/services/notification';
import socket from './src/services/socket';

const Stack = createStackNavigator();

export default function App() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      registerForPushNotifications().then((token) => {
        if (token) console.log('Push token:', token);
      });
      socket.connect();
      socket.emit('join_chats', { userId: user.id, chatIds: [] });
    }
    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
            <Stack.Screen name="Snap" component={SnapScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
