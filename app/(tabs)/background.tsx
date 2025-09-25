import WavyLayersBackground from '@/components/WavyLayersBackground'
import React from 'react'
import { Text, View } from 'react-native'


export default function Background(){
    return (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            <WavyLayersBackground />
            <Text>Background Screen</Text>
        </View>
    )

}