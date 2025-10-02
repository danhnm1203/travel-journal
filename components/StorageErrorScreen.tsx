import { useStore } from "@/store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import tw from "twrnc";

export default function StorageErrorScreen() {
  const [isClearing, setIsClearing] = useState(false);
  const clearStorageAndReset = useStore((state) => state.clearStorageAndReset);

  const handleClearStorage = async () => {
    Alert.alert(
      "Clear App Data",
      "This will permanently delete all your trips and notes stored locally. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearStorageAndReset();
              Alert.alert("Success", "App data cleared successfully!");
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to clear storage. Please restart the app."
              );
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={tw`flex-1 bg-red-50 justify-center items-center px-6`}>
      <View style={tw`bg-white rounded-xl p-6 shadow-lg border border-red-200`}>
        <View style={tw`items-center mb-6`}>
          <Text style={tw`text-6xl mb-4`}>⚠️</Text>
          <Text style={tw`text-xl font-bold text-red-700 mb-2 text-center`}>
            Storage Error
          </Text>
          <Text style={tw`text-red-600 text-center leading-6`}>
            There was a problem loading your saved data. This could be due to
            corrupted storage or a version incompatibility.
          </Text>
        </View>

        <View style={tw`mb-6`}>
          <Text style={tw`text-gray-700 text-sm leading-5 mb-3`}>
            You can try the following options:
          </Text>
          <Text style={tw`text-gray-600 text-sm leading-5`}>
            • Restart the app{"\n"}
            • Clear app data (this will delete all local trips and notes)
          </Text>
        </View>

        <Pressable
          style={tw`bg-red-600 rounded-lg py-4 px-6 ${
            isClearing ? "opacity-50" : ""
          }`}
          onPress={handleClearStorage}
          disabled={isClearing}
        >
          <View style={tw`flex-row justify-center items-center`}>
            {isClearing && (
              <ActivityIndicator
                size="small"
                color="white"
                style={tw`mr-2`}
              />
            )}
            <Text style={tw`text-white font-semibold text-center`}>
              {isClearing ? "Clearing..." : "Clear App Data"}
            </Text>
          </View>
        </Pressable>

        <Text style={tw`text-gray-500 text-xs text-center mt-4`}>
          Note: Data synced to the server will be restored when you go online
        </Text>
      </View>
    </View>
  );
}