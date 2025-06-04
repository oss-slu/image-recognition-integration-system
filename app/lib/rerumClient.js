// lib/rerumClient.js

import axios from 'axios';

const RERUM_API_BASE = 'https://store.rerum.io/v1';
const RERUM_API_KEY = process.env.NEXT_PUBLIC_RERUM_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${RERUM_API_KEY}`, // RERUM uses Bearer tokens
};

export async function createAnnotation(annotation) {
  const response = await axios.post(`${RERUM_API_BASE}/create`, annotation, { headers });
  return response.data;
}

export async function getAnnotation(id) {
  const response = await axios.get(`${RERUM_API_BASE}/id/${id}`, { headers });
  return response.data;
}

export async function updateAnnotation(annotation) {
  const response = await axios.put(`${RERUM_API_BASE}/update`, annotation, { headers });
  return response.data;
}
