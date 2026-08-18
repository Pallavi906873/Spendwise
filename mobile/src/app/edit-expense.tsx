import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { updateExpense } from '../api';

export default function EditExpenseScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      token?: string;
      id?: string;
      title?: string;
      amount?: string;
      category?: string;
      description?: string;
      date?: string;
    }>();

  const token = params.token || '';
  const id = params.id || '';

  const [title, setTitle] =
    useState(params.title || '');

  const [amount, setAmount] =
    useState(params.amount || '');

  const [category, setCategory] =
    useState(params.category || '');

  const [description, setDescription] =
    useState(
      params.description || ''
    );

  const [loading, setLoading] =
    useState(false);

  const handleUpdate = async () => {
    if (loading) return;

    if (!token) {
      Alert.alert(
        'Error',
        'Login information is missing.'
      );
      return;
    }

    if (!id) {
      Alert.alert(
        'Error',
        'Expense ID is missing.'
      );
      return;
    }

    const cleanTitle = title.trim();
    const cleanCategory =
      category.trim();
    const numericAmount =
      Number(amount);

    if (!cleanTitle) {
      Alert.alert(
        'Error',
        'Please enter a title.'
      );
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert(
        'Error',
        'Please enter a valid amount.'
      );
      return;
    }

    if (!cleanCategory) {
      Alert.alert(
        'Error',
        'Please enter a category.'
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        'UPDATE REQUEST START',
        {
          id,
          title: cleanTitle,
          amount: numericAmount,
          category: cleanCategory,
        }
      );

      const result =
        await updateExpense(
          token,
          Number(id),
          {
            title: cleanTitle,
            amount: numericAmount,
            category: cleanCategory,
            description:
              description.trim(),
            date:
              params.date || undefined,
          }
        );

      console.log(
        'UPDATE SUCCESS:',
        result
      );

      setLoading(false);

      Alert.alert(
        'Success',
        'Expense updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({
                pathname: '/dashboard',
                params: { token },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        'UPDATE ERROR:',
        error
      );

      setLoading(false);

      Alert.alert(
        'Update Failed',
        error?.message ||
          'Could not update expense.'
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.logo}>
        SpendWise
      </Text>

      <Text style={styles.title}>
        Edit Expense
      </Text>

      <View style={styles.card}>
        {/* TITLE */}

        <Text style={styles.label}>
          Title
        </Text>

        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Expense title"
        />

        {/* AMOUNT */}

        <Text style={styles.label}>
          Amount
        </Text>

        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount"
          keyboardType="numeric"
        />

        {/* CATEGORY */}

        <Text style={styles.label}>
          Category
        </Text>

        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Category"
        />

        {/* DESCRIPTION */}

        <Text style={styles.label}>
          Description
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.description,
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          multiline
        />

        {/* UPDATE */}

        <Pressable
          style={[
            styles.updateButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.updateText}>
            {loading
              ? 'Updating...'
              : 'UPDATE EXPENSE'}
          </Text>
        </Pressable>

        {/* CANCEL */}

        <Pressable
          style={styles.cancelButton}
          onPress={() =>
            router.replace({
              pathname: '/dashboard',
              params: { token },
            })
          }
          disabled={loading}
        >
          <Text style={styles.cancelText}>
            CANCEL
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },

  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 6,
    marginBottom: 20,
  },

  card: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },

  description: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  updateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.6,
  },

  updateText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  cancelButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },

  cancelText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: 'bold',
  },
});