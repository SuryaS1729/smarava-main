

import TabHomeIcon from "@/components/TabHomeIcon";
import { Tabs } from "expo-router";


export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: true,
      tabBarShowLabel: false,
      tabBarStyle: {
    height: 100, // Increase tab bar height
    paddingBottom: 10,
    paddingTop: 20,
  },
      }}>
      <Tabs.Screen 
      name="index" 
      options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabHomeIcon focused={focused} />,



        }} />
      <Tabs.Screen name="review" options={{ title: "Review" }} />
      <Tabs.Screen name="background" options={{ title: "Background" }} />
    </Tabs>
  );
}
