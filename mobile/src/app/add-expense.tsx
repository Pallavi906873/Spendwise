import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createExpense,
  getCategories,
} from '../api';

type Category = {
  id: number;
  name: string;
};

const CATEGORY_ORDER = [
  'Food',
  'Travel',
  'Shopping',
  'Stationary',
  'Bills',
  'Others',
];

export default function AddExpenseScreen() {
  const router = useRouter();

  const { token } =
    useLocalSearchParams<{ token: string }>();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] =
    useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

 const loadCategories = async () => {
  try {
    setLoadingCategories(true);

    const data = await getCategories();

    const orderedCategories: Category[] = [];

    CATEGORY_ORDER.forEach((wantedName) => {
      const found = data.find(
        (item: Category) => {
          const itemName =
            item.name.trim().toLowerCase();

          const targetName =
            wantedName.toLowerCase();

          if (
            targetName === 'others' &&
            itemName === 'other'
          ) {
            return true;
          }

          return itemName === targetName;
        }
      );

      if (found) {
        orderedCategories.push({
          ...found,
          name: wantedName,
        });
      }
    });

    setCategories(orderedCategories);

  } catch (error) {
    console.error(
      'CATEGORY LOAD ERROR:',
      error
    );
  } finally {
    setLoadingCategories(false);
  }
};
  const handleAddExpense = async () => {
    if (loading) return;

console.log('HANDLE STARTED');
console.log('LOADING:', loading);
console.log('TOKEN:', token);

    if (!token) {
      Alert.alert(
        'Error',
        'Please login again.'
      );
      return;
    }
setError('');
    const cleanTitle = title.trim();
    const cleanAmount = amount.trim();
    const cleanDescription =
      description.trim();
      console.log('CLEAN TITLE:', cleanTitle);

    if (!cleanTitle) {
  setError('Please enter an expense title.');
  return;
}

    if (!cleanAmount) {
  setError('Please enter an amount.');
  return;
}
if (!category) {
  setError('Please select a category.');
  return;
}

    if (!date) {
  setError('Please enter a date.');
  return;
}

    const numericAmount =
      Number(cleanAmount);

   if (
  !Number.isFinite(numericAmount) ||
  numericAmount <= 0
) {
  setError('Please enter a valid amount greater than 0.');
  return;
}
    try {
      setLoading(true);

      console.log(
        'ADDING EXPENSE:',
        {
          title: cleanTitle,
          amount: numericAmount,
          category,
          date,
        }
      );

      await createExpense(token, {
        title: cleanTitle,
        amount: numericAmount,
        category,
        date: new Date(
          `${date}T00:00:00`
        ).toISOString(),
        description: cleanDescription,
      });

      Alert.alert(
        'Success',
        'Expense added successfully.',
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
    'ADD EXPENSE ERROR:',
    error
  );

  setError(
    error?.message ||
      'Failed to add expense.'
  );
} finally {
  setLoading(false);
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
        Add Expense
      </Text>

      <View style={styles.card}>

        {/* TITLE */}

        <Text style={styles.label}>
          Title
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Expense title"
          value={title}
          onChangeText={setTitle}
        />

        {/* AMOUNT */}

        <Text style={styles.label}>
          Amount
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* DATE */}

        <Text style={styles.label}>
          Date
        </Text>

        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.dateHint}>
          Example: 2026-08-18
        </Text>

        {/* CATEGORY */}

        <Text style={styles.label}>
          Category
        </Text>

        {loadingCategories ? (
          <ActivityIndicator
            size="small"
            style={styles.categoryLoader}
          />
        ) : categories.length > 0 ? (
          <View style={styles.categoryContainer}>
            {categories.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.categoryButton,
                  category === item.name &&
                    styles.selectedCategoryButton,
                ]}
                onPress={() =>
                  setCategory(item.name)
                }
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === item.name &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.noCategoryText}>
            No categories available.
          </Text>
        )}

        {category ? (
          <Text style={styles.selectedLabel}>
            Selected: {category}
          </Text>
        ) : null}

        {/* DESCRIPTION */}

        <Text style={styles.label}>
          Description
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.description,
          ]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        {error ? (
  <Text style={styles.errorText}>
    {error}
  </Text>
) : null}

        {/* ADD */}

        <Pressable
          style={[
            styles.button,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleAddExpense}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Adding...'
              : 'ADD EXPENSE'}
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
            Cancel
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

  dateHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: -10,
    marginBottom: 16,
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },

  categoryButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },

  selectedCategoryButton: {
    backgroundColor: '#2563eb',
  },

  categoryText: {
    color: '#334155',
    fontWeight: '600',
  },

  selectedCategoryText: {
    color: '#ffffff',
  },

  selectedLabel: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },

  categoryLoader: {
    marginVertical: 15,
  },

  noCategoryText: {
    color: '#64748b',
    marginBottom: 16,
  },

  description: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
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
  errorText: {
  color: '#dc2626',
  fontSize: 14,
  fontWeight: '600',
  marginBottom: 12,
},
});