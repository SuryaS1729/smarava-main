

import TabBookIcon from "@/components/TabBookIcon";
import TabGameIcon from "@/components/TabGameIcon";
import TabHomeIcon from "@/components/TabHomeIcon";
import { Tabs } from "expo-router";


export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: true,
      tabBarShowLabel: true,
      


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
          tabBarIcon: ({ focused }) => <TabHomeIcon focused={focused} />}}
           />
      <Tabs.Screen 
      name="review" 
      options={{
          title: 'Summary',
          tabBarIcon: ({ focused }) => <TabBookIcon focused={focused} />,
        }}/>
          <Tabs.Screen 
      name="background" 
      options={{
          title: 'Game',
          tabBarIcon: ({ focused }) => <TabGameIcon focused={focused} />,
        }}/>
      
    </Tabs>
  );
}
