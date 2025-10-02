import { TripFormData, TripFormSchema } from "@/lib/validations";
import { useStore } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";

export default function AddTripScreen() {
  const router = useRouter();
  const { createTrip, loading } = useStore();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TripFormData>({
    resolver: zodResolver(TripFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      coverImage: "",
    },
  });

  const onSubmit = async (data: TripFormData) => {
    try {
      const newTripData = {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        coverImage: data.coverImage || "",
      };

      await createTrip(newTripData);
      reset();
      Alert.alert("Success", "Trip created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create trip"
      );
    }
  };

  const isLoadingState = isSubmitting || loading;

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      <View style={[tw`p-6`, { paddingTop: insets.top + 24 }]}>
        <Text style={tw`text-2xl font-bold text-gray-800 mb-6`}>
          Add New Trip
        </Text>

        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Trip Title *
          </Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={tw`border border-gray-300 rounded-lg px-4 py-3 bg-white ${
                  errors.title ? "border-red-500" : ""
                }`}
                placeholder="Enter trip title"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isLoadingState}
              />
            )}
          />
          {errors.title && (
            <Text style={tw`text-red-500 text-sm mt-1`}>
              {errors.title.message}
            </Text>
          )}
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Description
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={tw`border border-gray-300 rounded-lg px-4 py-3 bg-white min-h-20 ${
                  errors.description ? "border-red-500" : ""
                }`}
                placeholder="Describe your trip"
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                textAlignVertical="top"
                editable={!isLoadingState}
              />
            )}
          />
          {errors.description && (
            <Text style={tw`text-red-500 text-sm mt-1`}>
              {errors.description.message}
            </Text>
          )}
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Start Date *
          </Text>
          <Controller
            control={control}
            name="startDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={tw`border border-gray-300 rounded-lg px-4 py-3 bg-white ${
                  errors.startDate ? "border-red-500" : ""
                }`}
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isLoadingState}
              />
            )}
          />
          {errors.startDate && (
            <Text style={tw`text-red-500 text-sm mt-1`}>
              {errors.startDate.message}
            </Text>
          )}
        </View>

        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            End Date *
          </Text>
          <Controller
            control={control}
            name="endDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={tw`border border-gray-300 rounded-lg px-4 py-3 bg-white ${
                  errors.endDate ? "border-red-500" : ""
                }`}
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isLoadingState}
              />
            )}
          />
          {errors.endDate && (
            <Text style={tw`text-red-500 text-sm mt-1`}>
              {errors.endDate.message}
            </Text>
          )}
        </View>

        <Pressable
          style={tw`bg-blue-600 rounded-lg py-4 ${
            isLoadingState ? "opacity-50" : ""
          }`}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoadingState}
        >
          <View style={tw`flex-row justify-center items-center`}>
            {isLoadingState && (
              <ActivityIndicator size="small" color="white" style={tw`mr-2`} />
            )}
            <Text style={tw`text-white font-semibold text-center`}>
              {isLoadingState ? "Creating Trip..." : "Create Trip"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={tw`border border-gray-300 rounded-lg py-4 mt-3`}
          onPress={() => router.back()}
          disabled={isLoadingState}
        >
          <Text style={tw`text-gray-600 font-semibold text-center`}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
