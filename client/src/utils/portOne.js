import * as PortOne from '@portone/browser-sdk/v2'

const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID?.trim()
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY?.trim()

const PAY_METHOD_MAP = {
  card: 'CARD',
  bank_transfer: 'TRANSFER',
}

function assertPortOneConfig() {
  if (!STORE_ID) {
    throw new Error('VITE_PORTONE_STORE_ID를 client/.env에 설정해주세요. (콘솔 > 결제 연동 > Store ID)')
  }

  if (!CHANNEL_KEY) {
    throw new Error('VITE_PORTONE_CHANNEL_KEY를 client/.env에 설정해주세요.')
  }
}

export function buildPortOnePaymentRequest({
  paymentId,
  orderName,
  amount,
  payMethod,
  user,
  shippingAddress,
  redirectUrl,
}) {
  assertPortOneConfig()

  return {
    storeId: STORE_ID,
    channelKey: CHANNEL_KEY,
    paymentId,
    orderName,
    totalAmount: Math.max(100, amount),
    currency: 'KRW',
    payMethod: PAY_METHOD_MAP[payMethod] || 'CARD',
    redirectUrl,
    customer: {
      fullName: shippingAddress.recipientName,
      email: user.email,
      phoneNumber: shippingAddress.phone,
      zipcode: shippingAddress.postalCode || '',
      address: {
        addressLine1: shippingAddress.address,
        addressLine2: '',
      },
    },
  }
}

/**
 * PortOne V2 결제 요청
 * PC: Promise 반환 | 모바일: redirectUrl로 리디렉션 (undefined 반환)
 */
export async function requestPortOnePayment(request) {
  const response = await PortOne.requestPayment(request)

  if (response == null) {
    return null
  }

  if (response.code) {
    throw new Error(response.message || '결제에 실패했습니다.')
  }

  return response
}
