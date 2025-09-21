import { useEffect, useState } from "react";
import { Button, FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useWords } from "../../src/state/useWords";

export default function WordsScreen() {
  const { words, loading, initAndLoad, add, remove, reload } = useWords();
  const [text, setText] = useState("");

  useEffect(() => { initAndLoad(); }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Smara — Words</Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a word or phrase"
          style={{ flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10 }}
          onSubmitEditing={() => { add(text); setText(""); }}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Button title="Add" onPress={() => { add(text); setText(""); }} />
      </View>

      <FlatList
        data={words}
        keyExtractor={(w) => String(w.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 10, flexDirection: "row", justifyContent: "space-between" }}>
            <Text>{item.text}</Text>
            <Pressable onPress={() => remove(item.id)}>
              <Text style={{ color: "#b91c1c" }}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
