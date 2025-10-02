import LoadingSkeleton from "@/components/LoadingSkeleton";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";
import { useStore } from "../../../store";

export default function TripsScreen() {
  const router = useRouter();
  const { trips, loading, isOnline, outbox, fetchTrips, deleteTrip } =
    useStore();
  const insets = useSafeAreaInsets();

  if (loading && trips.length === 0) {
    return <LoadingSkeleton />;
  }

  const handleRefresh = () => {
    fetchTrips();
  };

  const handleDeleteTrip = (tripId: string, tripTitle: string) => {
    Alert.alert(
      "Delete Trip",
      `Are you sure you want to delete "${tripTitle}"? This will also delete all associated notes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip(tripId);
              Alert.alert("Success", "Trip deleted successfully!");
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to delete trip"
              );
            }
          },
        },
      ]
    );
  };

  const renderTrip = ({ item }: { item: any }) => {
    return (
      <Pressable
        style={tw`bg-white rounded-xl p-5 mb-4 shadow-lg border border-gray-100`}
        onPress={() =>
          router.push({ pathname: "/trip/[id]", params: { id: item.id } })
        }
        onLongPress={() => handleDeleteTrip(item.id, item.title)}
      >
        <View style={tw`flex-row justify-between items-start mb-3`}>
          <View style={tw`flex-1 mr-3`}>
            <Text style={tw`text-xl font-bold text-gray-900 mb-1`}>
              {item.title}
            </Text>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-sm font-medium`}>
                📅 {format(item.startDate, "MMM d")} -{" "}
                {format(item.endDate, "MMM d, yyyy")}
              </Text>
              <Text style={tw`text-xs text-gray-400`}>Hold to delete</Text>
            </View>
          </View>
        </View>

        {item.description && (
          <Text
            style={tw`text-sm text-gray-600 leading-5 mb-2`}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={tw`flex-1 bg-gradient-to-b from-blue-50 to-gray-50`}>
      <View
        style={[
          tw`bg-white px-6 pb-6 border-b border-gray-100`,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={tw`text-2xl font-bold text-gray-900 mb-1`}>My Trips</Text>
        <Text style={tw`text-sm text-gray-600`}>
          {trips.length === 0
            ? "No trips yet"
            : `${trips.length} trip${trips.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {!isOnline && (
        <View style={tw`bg-amber-50 px-4 py-3 border-b border-amber-200`}>
          <View style={tw`flex-row items-center justify-center`}>
            <Text style={tw`text-amber-700 text-sm font-medium`}>
              Offline Mode
            </Text>
            {outbox.length > 0 && (
              <View style={tw`ml-2 px-2 py-1 bg-amber-200 rounded-full`}>
                <Text style={tw`text-amber-800 text-xs font-bold`}>
                  {outbox.length} pending
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`px-4 pt-4 pb-6 ${
          trips.length === 0 ? "flex-1" : ""
        }`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={tw`flex-1 items-center justify-center py-16`}>
            <View style={tw`items-center mb-8`}>
              <Text style={tw`text-8xl mb-4`}>✈️</Text>
              <Text style={tw`text-xl font-semibold text-gray-700 mb-2`}>
                No trips yet
              </Text>
            </View>
            <Pressable
              style={tw`bg-blue-600 rounded-xl px-6 py-3 shadow-lg`}
              onPress={() => router.push("/add")}
            >
              <Text style={tw`text-white font-semibold text-base`}>
                Plan Your First Trip
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}
