import { useEffect, useMemo, useState } from "react";
import { Alert, Button, FlatList, Text, View } from "react-native";
import { useWords } from "../../src/state/useWords";

function last3DaysStartIso() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 3);
  return start.toISOString();
}

export default function ReviewScreen() {
  const { words, initAndLoad } = useWords();
  const [busy, setBusy] = useState(false);

  useEffect(() => { initAndLoad(); }, []);

  const startIso = last3DaysStartIso();
  const recent = useMemo(
    () => words.filter(w => Date.parse(w.created_at) >= Date.parse(startIso)),
    [words, startIso]
  );

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Review</Text>

      <Text style={{ fontWeight: "600" }}>Words in last 3 days ({recent.length}):</Text>
      <FlatList
        data={recent}
        keyExtractor={(w) => String(w.id)}
        style={{ maxHeight: 220 }}
        renderItem={({ item }) => <Text>• {item.text}</Text>}
      />

      <Button
        title={busy ? "Generating…" : "Generate"}
        onPress={async () => {
          if (!recent.length) return Alert.alert("Nothing to generate", "Add words first on the Words tab.");
          setBusy(true);
          // V0 stub: just show an alert. (Hook up LLM in later versions.)
          setTimeout(() => {
            setBusy(false);
            Alert.alert("Stub", "Generation will be added in V0.7.");
          }, 800);
        }}
        disabled={busy}
      />
    </View>
  );
}
