import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import StorageErrorScreen from "@/components/StorageErrorScreen";
import { useColorScheme } from "@/hooks/use-color-scheme";
import "@/lib/networkSimulator";
import { useStore } from "@/store";
import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import tw from "twrnc";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loadPersistedData, setOnline, storageError } = useStore();

  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log("🌐 Network state changed:", state.isConnected);
      setOnline(!!state.isConnected);
    });

    NetInfo.fetch().then((state) => {
      console.log("🌐 Initial network state:", state.isConnected);
      setOnline(!!state.isConnected);
    });

    return unsubscribe;
  }, [setOnline]);

  if (storageError) {
    return <StorageErrorScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            title: "Travel Journal",
          }}
        />
        <Stack.Screen
          name="trip/[id]"
          options={({ navigation }) => ({
            headerShown: true,
            title: "Trip Details",
            headerBackTitle: "Trips",
            presentation: "card",
            headerLeft: () => (
              <Pressable
                onPress={() =>
                  navigation.navigate("(tabs)", { screen: "trips/index" })
                }
                style={tw`mr-4 ml-4`}
              >
                <Text style={tw`text-blue-500 text-lg`}>Trips</Text>
              </Pressable>
            ),
          })}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
