import React from "react";
import { View } from "react-native";
import tw from "twrnc";

const SkeletonBox = ({ width, height }: { width: string; height: string }) => (
  <View
    style={tw`bg-gray-200 rounded ${width} ${height} animate-pulse`}
  />
);

export default function LoadingSkeleton() {
  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-white px-6 pb-6 pt-16 border-b border-gray-100`}>
        <SkeletonBox width="w-32" height="h-8" />
        <View style={tw`mt-2`}>
          <SkeletonBox width="w-24" height="h-4" />
        </View>
      </View>

      <View style={tw`px-4 pt-4`}>
        {[1, 2, 3].map((index) => (
          <View
            key={index}
            style={tw`bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100`}
          >
            <View style={tw`flex-row justify-between items-start mb-3`}>
              <View style={tw`flex-1 mr-3`}>
                <SkeletonBox width="w-48" height="h-6" />
                <View style={tw`mt-2`}>
                  <SkeletonBox width="w-36" height="h-4" />
                </View>
              </View>
            </View>
            <SkeletonBox width="w-full" height="h-4" />
            <View style={tw`mt-2`}>
              <SkeletonBox width="w-3/4" height="h-4" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}