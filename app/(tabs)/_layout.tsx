import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen name="index" options={{ title: "Words" }} />
      <Tabs.Screen name="review" options={{ title: "Review" }} />
    </Tabs>
  );
}
