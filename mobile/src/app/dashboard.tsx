import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  deleteExpense,
  getCategories,
  getExpenses,
} from '../api';

type Expense = {
  _id: number;
  title: string;
  amount: number;
  date?: string;
  description?: string;
  category: string;
  user?: string;
};

type Category = {
  id: number;
  name: string;
};

export default function DashboardScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, [token]);

  const loadExpenses = async (
    searchText = search,
    category = selectedCategory
  ) => {
    if (!token) {
      setError('Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await getExpenses(
        token,
        searchText,
        category
      );

      setExpenses(data);
    } catch (err: any) {
      console.log('EXPENSE LOAD ERROR:', err);
      setError(err?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

 const loadCategories = async () => {
  try {
    const data = await getCategories();

    const categoryOrder = [
      'Food',
      'Travel',
      'Shopping',
      'Stationary',
      'Bills',
      'Others',
    ];

    const orderedCategories: Category[] = [];

    categoryOrder.forEach((wantedName) => {
      const found = data.find(
        (item: Category) => {
          const itemName =
            item.name.trim().toLowerCase();

          const targetName =
            wantedName.toLowerCase();

          // Treat "Other" and "Others" as the same
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

  } catch (err) {
    console.log(
      'CATEGORY LOAD ERROR:',
      err
    );
  }
};
  const handleSearch = (text: string) => {
    setSearch(text);
    loadExpenses(text, selectedCategory);
  };

  const handleCategory = (category: string) => {
    setSelectedCategory(category);
    loadExpenses(search, category);
  };

   const handleDelete = async (id: number) => {
  if (!token) {
    Alert.alert('Error', 'Please login again.');
    return;
  }

  const performDelete = async () => {
    try {
      setLoading(true);

      console.log('Deleting expense:', id);
      console.log('Token exists:', !!token);

      await deleteExpense(token, id);

      setExpenses((prev) =>
        prev.filter(
          (expense) => expense.id !== id
        )
      );

      if (Platform.OS !== 'web') {
        Alert.alert(
          'Success',
          'Expense deleted successfully.'
        );
      }
    } catch (err: any) {
      console.error('DELETE ERROR:', err);

      if (Platform.OS === 'web') {
        window.alert(
          err?.message ||
            'Failed to delete expense.'
        );
      } else {
        Alert.alert(
          'Delete Failed',
          err?.message ||
            'Failed to delete expense.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS === 'web') {
    const confirmed = window.confirm(
      'Are you sure you want to delete this expense?'
    );

    if (!confirmed) return;

    await performDelete();
    return;
  }

  Alert.alert(
    'Delete Expense',
    'Are you sure you want to delete this expense?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: performDelete,
      },
    ]
  );
};
const handleLogout = () => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(
      'Are you sure you want to logout?'
    );

    if (!confirmed) return;

    console.log('LOGOUT CONFIRMED');
    router.replace('/');
    return;
  }

  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          console.log('LOGOUT CONFIRMED');
          router.replace('/');
        },
      },
    ]
  );
};
  const total = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.amount),
    0
  );

  const average =
    expenses.length > 0
      ? total / expenses.length
      : 0;

  const largestExpense =
    expenses.length > 0
      ? expenses.reduce((largest, expense) =>
          Number(expense.amount) >
          Number(largest.amount)
            ? expense
            : largest
        )
      : null;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTotal = expenses.reduce(
    (sum, expense) => {
      if (!expense.date) return sum;

      const expenseDate = new Date(
        expense.date
      );

      if (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      ) {
        return (
          sum + Number(expense.amount)
        );
      }

      return sum;
    },
    0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* HEADER */}

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.logo}>
            SpendWise
          </Text>

          <Text style={styles.title}>
            Dashboard
          </Text>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </Pressable>
      </View>

      {/* WELCOME */}

      <View style={styles.welcomeCard}>
        <View>
          <Text style={styles.welcomeSmall}>
            Welcome back 👋
          </Text>

          <Text style={styles.welcomeTitle}>
            Manage your expenses
          </Text>

          <Text style={styles.welcomeDescription}>
            Keep track of your spending
            and stay in control.
          </Text>
        </View>
      </View>

      {/* TOTAL */}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          Total Expenses
        </Text>

        <Text style={styles.total}>
          ₹{total.toFixed(2)}
        </Text>

        <Text style={styles.count}>
          {expenses.length} expense
          {expenses.length !== 1
            ? 's'
            : ''}
        </Text>
      </View>

      {/* STATS */}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            Average
          </Text>

          <Text style={styles.statValue}>
            ₹{average.toFixed(2)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            Largest
          </Text>

          <Text style={styles.statValue}>
            ₹
            {largestExpense
              ? Number(
                  largestExpense.amount
                ).toFixed(2)
              : '0.00'}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            This Month
          </Text>

          <Text style={styles.statValue}>
            ₹{thisMonthTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* LARGEST EXPENSE */}

      {largestExpense && (
        <View style={styles.largestCard}>
          <View>
            <Text style={styles.largestLabel}>
              Largest Expense
            </Text>

            <Text style={styles.largestTitle}>
              {largestExpense.title}
            </Text>

            <Text style={styles.largestCategory}>
              {largestExpense.category}
            </Text>
          </View>

          <Text style={styles.largestAmount}>
            ₹
            {Number(
              largestExpense.amount
            ).toFixed(2)}
          </Text>
        </View>
      )}

      {/* ADD EXPENSE */}

      <Pressable
        style={styles.addButton}
        onPress={() =>
          router.push({
            pathname: '/add-expense',
            params: { token },
          })
        }
      >
        <Text style={styles.addButtonText}>
          + Add Expense
        </Text>
      </Pressable>

      {/* SEARCH */}

      <Text style={styles.sectionLabel}>
        Search Expenses
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by expense name..."
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={handleSearch}
      />

      {/* CATEGORY */}

      <Text style={styles.sectionLabel}>
        Filter by Category
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={
          styles.categoryContent
        }
      >
        <Pressable
          style={[
            styles.categoryButton,
            selectedCategory === 'All' &&
              styles.selectedCategoryButton,
          ]}
          onPress={() =>
            handleCategory('All')
          }
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === 'All' &&
                styles.selectedCategoryText,
            ]}
          >
            All
          </Text>
        </Pressable>

        {categories.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.categoryButton,
              selectedCategory ===
                item.name &&
                styles.selectedCategoryButton,
            ]}
            onPress={() =>
              handleCategory(item.name)
            }
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory ===
                  item.name &&
                  styles.selectedCategoryText,
              ]}
            >
              {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* RECENT EXPENSES */}

      <View style={styles.expenseHeader}>
        <Text style={styles.sectionTitle}>
          Recent Expenses
        </Text>

        <Text style={styles.expenseCount}>
          {expenses.length}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color="#2563eb"
          />

          <Text style={styles.loadingText}>
            Loading expenses...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.messageCard}>
          <Text style={styles.error}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() =>
              loadExpenses()
            }
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.messageCard}>
          <Text style={styles.emptyIcon}>
            💰
          </Text>

          <Text style={styles.emptyTitle}>
            No expenses found
          </Text>

          <Text style={styles.emptyText}>
            Add your first expense to start
            tracking your spending.
          </Text>
        </View>
      ) : (
        <View style={styles.expenseList}>
          {expenses.map((item) => (
            <View
              key={item._id}
              style={styles.expenseCard}
            >
              <View style={styles.expenseInfo}>
                <Text
                  style={styles.expenseTitle}
                >
                  {item.title}
                </Text>

                <Text style={styles.category}>
                  {item.category}
                </Text>

                {item.description ? (
                  <Text
                    style={styles.description}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}

                {item.date ? (
                  <Text style={styles.date}>
                    {new Date(
                      item.date
                    ).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>

              <View style={styles.rightSection}>
                <Text style={styles.amount}>
                  ₹
                  {Number(
                    item.amount
                  ).toFixed(2)}
                </Text>

                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/edit-expense',
                        params: {
                          token,
                          id: String(
                            item._id
                          ),
                          title:
                            item.title,
                          amount:
                            String(
                              item.amount
                            ),
                          category:
                            item.category,
                          description:
                            item.description ||
                            '',
                          date:
                            item.date ||
                            '',
                        },
                      })
                    }
                  >
                    <Text style={styles.editText}>
                      Edit
                    </Text>
                  </Pressable>

                <Pressable
  style={styles.deleteButton}
  onPress={() => handleDelete(Number(item._id))}
>
  <Text style={styles.deleteText}>
    Delete
  </Text>
</Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 50,
  },

  /* HEADER */

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  logo: {
    fontSize: 27,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: -0.5,
  },

  title: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },

  logoutButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 9,
  },

  logoutText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },

  /* WELCOME */

  welcomeCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },

  welcomeSmall: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },

  welcomeTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },

  welcomeDescription: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 5,
  },

  /* SUMMARY */

  summaryCard: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 15,
    marginBottom: 12,
    elevation: 3,
  },

  summaryLabel: {
    color: '#dbeafe',
    fontSize: 13,
    fontWeight: '600',
  },

  total: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },

  count: {
    color: '#dbeafe',
    fontSize: 12,
    marginTop: 5,
  },

  /* STATS */

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 13,
    padding: 12,
    minHeight: 82,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },

  statValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },

  /* LARGEST */

  largestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  largestLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },

  largestTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },

  largestCategory: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 3,
  },

  largestAmount: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '800',
  },

  /* ADD */

  addButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 15,
    borderRadius: 11,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 2,
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  /* SEARCH */

  sectionLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },

  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe2ea',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
  },

  /* CATEGORY */

  categoryScroll: {
    marginBottom: 18,
  },

  categoryContent: {
    paddingRight: 10,
  },

  categoryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe2ea',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 22,
    marginRight: 8,
  },

  selectedCategoryButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },

  categoryButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },

  selectedCategoryText: {
    color: '#ffffff',
  },

  /* EXPENSE HEADER */

  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#0f172a',
    fontSize: 19,
    fontWeight: '800',
  },

  expenseCount: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },

  /* LOADING */

  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
  },

  loadingText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
  },

  /* EXPENSE */

  expenseList: {
    width: '100%',
  },

  expenseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  expenseInfo: {
    flex: 1,
    paddingRight: 10,
  },

  expenseTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },

  category: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  description: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },

  date: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 5,
  },

  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  amount: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 9,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },

  editButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },

  editText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },

  deleteText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '800',
  },

  /* MESSAGES */

  messageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  emptyIcon: {
    fontSize: 30,
    marginBottom: 8,
  },

  emptyTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },

  emptyText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },

  error: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 15,
  },

  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },

  retryText: {
    color: '#ffffff',
    fontWeight: '800',
  },

  bottomSpace: {
    height: 30,
  },
});