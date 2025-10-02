import { useStore } from "@/store";
import { useEffect } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import tw from "twrnc";

export default function HomeScreen() {
  const { trips, fetchTrips } = useStore();

  useEffect(() => {
    fetchTrips()
  }, [])

  const renderItem = ({ item }: { item: any }) => (
    <Pressable style={tw`bg-white border border-gray-300 p-3`}>
      <Text>{item.title}</Text>
      <Text>{item.description}</Text>
    </Pressable>
  );
  return (
    <View style={tw`flex flex-1 mt-6`}>
      <FlatList
        contentContainerStyle={tw`pt-8`}
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View>
            <Text>No trips here</Text>
          </View>
        }
      ></FlatList>
    </View>
  );
}
