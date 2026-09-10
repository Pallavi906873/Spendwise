import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.25:3000';

async function getToken(token?: string) {
  if (token) {
    return token;
  }

  const savedToken = await AsyncStorage.getItem('userToken');

  if (!savedToken) {
    throw new Error('No login token found. Please login again.');
  }

  return savedToken;
}

// ==================== LOGIN ====================

export async function login(
  email: string,
  password: string
) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  // Save token automatically
  if (data.token) {
    await AsyncStorage.setItem(
      'userToken',
      data.token
    );
  }

  return data;
}

// ==================== REGISTER ====================

export async function register(
  email: string,
  password: string,
  name: string
) {
  const response = await fetch(
    `${API_URL}/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || 'Registration failed'
    );
  }

  return data;
}

// ==================== GET EXPENSES ====================

export async function getExpenses(
  token: string | undefined,
  search?: string,
  category?: string
) {
  const authToken = await getToken(token);

  const params = new URLSearchParams();

  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  if (
    category &&
    category !== 'All'
  ) {
    params.append('category', category);
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/expenses${
      query ? `?${query}` : ''
    }`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Failed to fetch expenses'
    );
  }

  return data;
}

// ==================== GET CATEGORIES ====================

export async function getCategories() {
  const response = await fetch(
    `${API_URL}/categories`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Failed to fetch categories'
    );
  }

  return data;
}

// ==================== CREATE EXPENSE ====================

export async function createExpense(
  token: string | undefined,
  expense: {
    title: string;
    amount: number;
    category: string;
    date?: string;
    description?: string;
  }
) {
  const authToken = await getToken(token);

  const response = await fetch(
    `${API_URL}/expenses`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(expense),
    }
  );

  const text = await response.text();

  let data: any;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      error: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        `Create failed (${response.status})`
    );
  }

  return data;
}

// ==================== UPDATE EXPENSE ====================

export async function updateExpense(
  token: string | undefined,
  id: number,
  expense: {
    title: string;
    amount: number;
    category: string;
    date?: string;
    description?: string;
  }
) {
  const authToken = await getToken(token);

  const response = await fetch(
    `${API_URL}/expenses/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(expense),
    }
  );

  const text = await response.text();

  let data: any;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      error: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        `Update failed (${response.status})`
    );
  }

  return data;
}

// ==================== DELETE EXPENSE ====================

export async function deleteExpense(
  token: string | undefined,
  id: number
) {
  const authToken = await getToken(token);

  console.log(
    'DELETE ID:',
    id
  );

  console.log(
    'DELETE TOKEN EXISTS:',
    !!authToken
  );

  const response = await fetch(
    `${API_URL}/expenses/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    }
  );

  const text = await response.text();

  let data: any;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      error: text,
    };
  }

  console.log(
    'DELETE RESPONSE:',
    response.status,
    data
  );

  if (!response.ok) {
    throw new Error(
      data.error ||
        `Delete failed (${response.status})`
    );
  }

  return data;
}