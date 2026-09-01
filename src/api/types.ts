export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: 'Player' | 'Admin';
  createdAtUtc: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
}

export interface AuthConfig {
  googleSignInEnabled: boolean;
  googleClientId: string | null;
}

export interface GameResponse {
  id: string;
  title: string;
  genre: string;
  platform: string;
  price: number;
  releaseDate: string;
  description: string | null;
  coverImageUrl: string | null;
  createdAtUtc: string;
}

export interface OrderItemResponse {
  gameId: string;
  price: number;
}

export interface OrderResponse {
  id: string;
  userId: string;
  items: OrderItemResponse[];
  totalPrice: number;
  status: 'Pending' | 'Paid' | 'Failed';
  createdAtUtc: string;
}

export interface LibraryItemResponse {
  gameId: string;
  orderId: string;
  purchasedAtUtc: string;
}

export interface OrderEventResponse {
  id: string;
  eventType: string;
  payload: string;
  occurredAtUtc: string;
}

export interface UserEventResponse {
  id: string;
  eventType: string;
  payload: string;
  occurredAtUtc: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  userId: string;
  price: number;
  status: 'Approved' | 'Rejected';
  gateway: string;
  requestPayload: string;
  responsePayload: string;
  processedAtUtc: string;
}

export interface NotificationResponse {
  id: string;
  type: 'Welcome' | 'PurchaseConfirmation' | 'PaymentFailed';
  userId: string;
  orderId: string | null;
  recipient: string;
  subject: string;
  body: string;
  channel: 'Console' | 'Resend';
  status: 'Pending' | 'Sent' | 'Failed';
  providerRequestPayload: string | null;
  providerResponsePayload: string | null;
  createdAtUtc: string;
}

export interface QuotationResponse {
  usdToBrlRate: number;
  asOf: string;
  source: string;
}

export interface PaymentCheckoutResponse {
  status: string;
  gateway: string;
  price: number;
  pixCopyPasteCode: string | null;
  pixQrCodeBase64: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
