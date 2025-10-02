import { NoteFormData, NoteFormSchema } from "@/lib/validations";
import { useStore } from "@/store";
import { Note } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import tw from "twrnc";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getTripById,
    getNotesByTripId,
    createNote,
    fetchNotes,
    loading,
    updateTrip,
    deleteTrip,
    deleteNote,
  } = useStore();

  const [showAddNote, setShowAddNote] = useState(false);
  const [showEditTrip, setShowEditTrip] = useState(false);

  const trip = getTripById(id!);
  const notes = getNotesByTripId(id!);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<NoteFormData>({
    resolver: zodResolver(NoteFormSchema),
    defaultValues: {
      content: "",
      tripId: id!,
    },
  });

  const {
    control: tripControl,
    handleSubmit: handleTripSubmit,
    formState: { isSubmitting: isTripSubmitting },
    reset: resetTrip,
  } = useForm({
    defaultValues: {
      title: trip?.title || "",
      description: trip?.description || "",
      startDate: trip?.startDate ? format(trip.startDate, "yyyy-MM-dd") : "",
      endDate: trip?.endDate ? format(trip.endDate, "yyyy-MM-dd") : "",
    },
  });

  useEffect(() => {
    if (id) {
      fetchNotes(id);
    }
  }, [id, fetchNotes]);

  const onSubmitNote = async (data: NoteFormData) => {
    try {
      await createNote(data);
      reset();
      setShowAddNote(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add note"
      );
    }
  };

  const onSubmitTripUpdate = async (data: any) => {
    try {
      await updateTrip(id!, {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
      setShowEditTrip(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update trip"
      );
    }
  };

  const handleDeleteTrip = () => {
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip? This will also delete all associated notes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip(id!);
              router.back();
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

  const handleDeleteNote = (noteId: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNote(noteId);
            Alert.alert("Success", "Note deleted successfully!");
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to delete note"
            );
          }
        },
      },
    ]);
  };

  const renderNote = ({ item }: { item: Note }) => (
    <View
      style={tw`bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200`}
    >
      <View style={tw`flex-row justify-between items-start`}>
        <View style={tw`flex-1 mr-3`}>
          <Text style={tw`text-gray-800 text-base leading-6 mb-2`}>
            {item.content}
          </Text>
          <Text style={tw`text-gray-500 text-sm`}>
            {format(item.createdAt, "MMM d, yyyy • h:mm a")}
          </Text>
        </View>
        <Pressable
          style={tw`p-2 rounded-lg bg-red-50 border border-red-200`}
          onPress={() => handleDeleteNote(item.id)}
        >
          <Text style={tw`text-red-600 text-xs font-semibold`}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );

  if (!trip) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Text style={tw`text-gray-600 text-lg`}>Trip not found</Text>
        <Pressable
          style={tw`mt-4 bg-blue-600 rounded-lg px-6 py-3`}
          onPress={() => router.push("/(tabs)/trips")}
        >
          <Text style={tw`text-white font-semibold`}>Go to Trips</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <ScrollView style={tw`flex-1`}>
        <View style={tw`bg-white p-6 border-b border-gray-200`}>
          <View style={tw`flex-row justify-between items-start mb-3`}>
            <View style={tw`flex-1 mr-4`}>
              <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>
                {trip.title}
              </Text>
              <Text style={tw`text-gray-600 text-base mb-2`}>
                {format(trip.startDate, "MMM d, yyyy")} -{" "}
                {format(trip.endDate, "MMM d, yyyy")}
              </Text>
            </View>
            <View style={tw`flex-row gap-2`}>
              <Pressable
                style={tw`p-3 rounded-lg bg-blue-50 border border-blue-200`}
                onPress={() => setShowEditTrip(true)}
              >
                <Text style={tw`text-blue-600 text-sm font-semibold`}>✏️</Text>
              </Pressable>
              <Pressable
                style={tw`p-3 rounded-lg bg-red-50 border border-red-200`}
                onPress={handleDeleteTrip}
              >
                <Text style={tw`text-red-600 text-sm font-semibold`}>🗑️</Text>
              </Pressable>
            </View>
          </View>
          {trip.description && (
            <Text style={tw`text-gray-700 text-base leading-6`}>
              {trip.description}
            </Text>
          )}
        </View>

        <View style={tw`p-4`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-900`}>
              Travel Notes ({notes.length})
            </Text>
            <Pressable
              style={tw`bg-blue-600 rounded-lg px-4 py-2`}
              onPress={() => setShowAddNote(!showAddNote)}
            >
              <Text style={tw`text-white font-semibold`}>
                {showAddNote ? "Cancel" : "Add Note"}
              </Text>
            </Pressable>
          </View>

          {showAddNote && (
            <View
              style={tw`bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200`}
            >
              <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
                Add New Note
              </Text>
              <Controller
                control={control}
                name="content"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={tw`border border-gray-300 rounded-lg px-4 py-3 bg-white min-h-24 ${
                      errors.content ? "border-red-500" : ""
                    }`}
                    placeholder="Put the note for this trip?"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    textAlignVertical="top"
                    editable={!isSubmitting}
                  />
                )}
              />
              {errors.content && (
                <Text style={tw`text-red-500 text-sm mt-1`}>
                  {errors.content.message}
                </Text>
              )}

              <View style={tw`flex-row justify-end mt-3 gap-2`}>
                <Pressable
                  style={tw`border border-gray-300 rounded-lg px-4 py-2`}
                  onPress={() => {
                    setShowAddNote(false);
                    reset();
                  }}
                  disabled={isSubmitting}
                >
                  <Text style={tw`text-gray-600 font-semibold`}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={tw`bg-blue-600 rounded-lg px-4 py-2 ${
                    isSubmitting ? "opacity-50" : ""
                  }`}
                  onPress={handleSubmit(onSubmitNote)}
                  disabled={isSubmitting}
                >
                  <View style={tw`flex-row items-center`}>
                    {isSubmitting && (
                      <ActivityIndicator
                        size="small"
                        color="white"
                        style={tw`mr-2`}
                      />
                    )}
                    <Text style={tw`text-white font-semibold`}>
                      {isSubmitting ? "Adding..." : "Add Note"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          {showEditTrip && (
            <View
              style={tw`bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200`}
            >
              <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
                Edit Trip
              </Text>

              <Controller
                control={tripControl}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={tw`mb-3`}>
                    <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>
                      Title
                    </Text>
                    <TextInput
                      style={tw`border border-gray-300 rounded-lg px-4 py-3 bg-white`}
                      placeholder="Trip title"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      editable={!isTripSubmitting}
                    />
                  </View>
                )}
              />

              <Controller
                control={tripControl}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={tw`mb-3`}>
                    <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>
                      Description
                    </Text>
                    <TextInput
                      style={tw`border border-gray-300 rounded-lg px-4 py-3 bg-white min-h-20`}
                      placeholder="Trip description"
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                      textAlignVertical="top"
                      editable={!isTripSubmitting}
                    />
                  </View>
                )}
              />

              <View style={tw`flex-row gap-3 mb-3`}>
                <Controller
                  control={tripControl}
                  name="startDate"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>
                        Start Date
                      </Text>
                      <TextInput
                        style={tw`border border-gray-300 rounded-lg px-4 py-3 bg-white`}
                        placeholder="YYYY-MM-DD"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        editable={!isTripSubmitting}
                      />
                    </View>
                  )}
                />

                <Controller
                  control={tripControl}
                  name="endDate"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>
                        End Date
                      </Text>
                      <TextInput
                        style={tw`border border-gray-300 rounded-lg px-4 py-3 bg-white`}
                        placeholder="YYYY-MM-DD"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        editable={!isTripSubmitting}
                      />
                    </View>
                  )}
                />
              </View>

              <View style={tw`flex-row justify-end mt-3 gap-2`}>
                <Pressable
                  style={tw`border border-gray-300 rounded-lg px-4 py-2`}
                  onPress={() => {
                    setShowEditTrip(false);
                    resetTrip();
                  }}
                  disabled={isTripSubmitting}
                >
                  <Text style={tw`text-gray-600 font-semibold`}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={tw`bg-blue-600 rounded-lg px-4 py-2 ${
                    isTripSubmitting ? "opacity-50" : ""
                  }`}
                  onPress={handleTripSubmit(onSubmitTripUpdate)}
                  disabled={isTripSubmitting}
                >
                  <View style={tw`flex-row items-center`}>
                    {isTripSubmitting && (
                      <ActivityIndicator
                        size="small"
                        color="white"
                        style={tw`mr-2`}
                      />
                    )}
                    <Text style={tw`text-white font-semibold`}>
                      {isTripSubmitting ? "Updating..." : "Update Trip"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          {loading ? (
            <View style={tw`py-8 items-center`}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={tw`text-gray-600 mt-2`}>Loading notes...</Text>
            </View>
          ) : notes.length > 0 ? (
            <FlatList
              data={notes}
              renderItem={renderNote}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={tw`py-12 items-center`}>
              <Text style={tw`text-gray-600 text-center`}>No notes yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
