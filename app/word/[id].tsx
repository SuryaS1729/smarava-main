import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useWords } from '../../src/state/useWords';

interface Definition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

interface Phonetic {
  text: string;
  audio?: string;
}

interface WordDefinition {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  origin?: string;
  meanings: Meaning[];
  isLLMGenerated?: boolean; // Flag to indicate LLM-generated content
}

const CACHE_KEY = 'word_definitions_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export default function WordDefinitionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { words } = useWords();
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loading, setLoading] = useState(false);

  // Find the word by ID
  const word = words.find(w => String(w.id) === String(id));

  const fetchLLMDefinition = async (wordText: string): Promise<WordDefinition> => {
    const prompt = `Please provide a comprehensive definition for the word/phrase: "${wordText}"

Format your response as a JSON object with this exact structure:
{
  "word": "${wordText}",
  "phonetic": "phonetic pronunciation if available",
  "meanings": [
    {
      "partOfSpeech": "noun/verb/adjective/etc",
      "definitions": [
        {
          "definition": "clear definition here",
          "example": "example sentence using the word",
          "synonyms": ["synonym1", "synonym2"],
          "antonyms": ["antonym1", "antonym2"]
        }
      ]
    }
  ],
  "origin": "etymology or origin if known"
}

If it's slang, Gen Z lingo, or a phrase, please still follow this format and explain its meaning, usage context, and provide relevant examples. Include multiple meanings if the word has different uses.`;

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3 // Lower temperature for more consistent formatting
        }
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('No content generated from LLM');
    }

    const generatedText = data.candidates[0].content.parts[0].text.trim();
    
    try {
      // Try to parse the JSON response
      const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      const parsedDefinition = JSON.parse(cleanedText);
      
      return {
        ...parsedDefinition,
        phonetics: parsedDefinition.phonetic ? [{ text: parsedDefinition.phonetic }] : [],
        isLLMGenerated: true
      };
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError);
      
      // Fallback: create a basic definition from the raw text
      return {
        word: wordText,
        phonetics: [],
        meanings: [
          {
            partOfSpeech: "unknown",
            definitions: [
              {
                definition: generatedText,
                synonyms: [],
                antonyms: []
              }
            ]
          }
        ],
        isLLMGenerated: true
      };
    }
  };

  const fetchDefinition = async (wordText: string) => {
    try {
      // Check persistent cache
      const cacheData = await AsyncStorage.getItem(CACHE_KEY);
      const cache = cacheData ? JSON.parse(cacheData) : {};
      
      const cached = cache[wordText.toLowerCase()];
      if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
        setDefinition(cached.data);
        return;
      }

      setLoading(true);
      
      try {
        // First, try the dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordText}`);
                console.log('Dictionary fetch first');

        if (response.ok) {
          const data = await response.json();
          const definition = data[0];
          
          // Save to persistent cache
          cache[wordText.toLowerCase()] = {
            data: definition,
            timestamp: Date.now()
          };
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
          
          setDefinition(definition);
          return;
        }
        
        // If dictionary API fails, fall back to LLM
        throw new Error('Dictionary API failed, using LLM fallback');
        
      } catch (dictionaryError) {
        console.log('Dictionary API failed, trying LLM fallback...');
        
        // Use LLM as fallback
        const llmDefinition = await fetchLLMDefinition(wordText);
        
        // Save LLM result to cache
        cache[wordText.toLowerCase()] = {
          data: llmDefinition,
          timestamp: Date.now()
        };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        
        setDefinition(llmDefinition);
      }
      
    } catch (error) {
      console.error('Error fetching definition:', error);
      Alert.alert('Error', 'Could not fetch definition for this word');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (word) {
      fetchDefinition(word.text);
    }
  }, [word]);

  if (!word) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Word not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.wordHeader}>
        <Text style={styles.wordTitle}>{word.text}</Text>
        {definition?.phonetic && (
          <Text style={styles.phonetic}>{definition.phonetic}</Text>
        )}
        {word.source_app && (
          <Text style={styles.source}>from {word.source_app}</Text>
        )}
        {definition?.isLLMGenerated && (
          <Text style={styles.llmIndicator}>✨ AI-generated definition</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Looking up definition...</Text>
        </View>
      ) : definition ? (
        <View style={styles.definitionContainer}>
          {definition.origin && (
            <View style={styles.originContainer}>
              <Text style={styles.sectionTitle}>Origin</Text>
              <Text style={styles.originText}>{definition.origin}</Text>
            </View>
          )}

          {definition.meanings.map((meaning, index) => (
            <View key={index} style={styles.meaningContainer}>
              <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
              
              {meaning.definitions.map((def, defIndex) => (
                <View key={defIndex} style={styles.definitionItem}>
                  <Text style={styles.definitionNumber}>{defIndex + 1}.</Text>
                  <View style={styles.definitionContent}>
                    <Text style={styles.definitionText}>{def.definition}</Text>
                    
                    {def.example && (
                      <Text style={styles.exampleText}>
                        Example: "{def.example}"
                      </Text>
                    )}
                    
                    {def.synonyms && def.synonyms.length > 0 && (
                      <Text style={styles.synonymsText}>
                        Synonyms: {def.synonyms.join(', ')}
                      </Text>
                    )}
                    
                    {def.antonyms && def.antonyms.length > 0 && (
                      <Text style={styles.antonymsText}>
                        Antonyms: {def.antonyms.join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No definition available</Text>
          <Text style={styles.errorSubtext}>
            Could not find a definition for "{word.text}"
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  wordHeader: {
    padding: 16,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  wordTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phonetic: {
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  source: {
    fontSize: 14,
    color: '#999',
  },
  llmIndicator: {
    fontSize: 12,
    color: '#9B59B6',
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  definitionContainer: {
    padding: 16,
  },
  originContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#4A90E2',
  },
  originText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  meaningContainer: {
    marginBottom: 24,
  },
  partOfSpeech: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  definitionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  definitionNumber: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
    marginTop: 2,
  },
  definitionContent: {
    flex: 1,
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 6,
  },
  synonymsText: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 4,
  },
  antonymsText: {
    fontSize: 14,
    color: '#e74c3c',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  error: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});