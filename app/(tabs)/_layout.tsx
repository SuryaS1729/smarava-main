import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from "expo-router";


export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen 
      name="index" 
      options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }} />
      <Tabs.Screen name="review" options={{ title: "Review" }} />
    </Tabs>
  );
}
