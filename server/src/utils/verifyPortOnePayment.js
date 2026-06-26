const PORTONE_API_BASE_URL = 'https://api.portone.io';
const MIN_PAYMENT_AMOUNT = 100;

class PaymentVerificationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'PaymentVerificationError';
    this.statusCode = statusCode;
  }
}

const getChargeAmount = (orderAmount) => Math.max(MIN_PAYMENT_AMOUNT, orderAmount);

const verifyPortOnePayment = async (paymentId, expectedAmount) => {
  const apiSecret = process.env.PORTONE_API_SECRET?.trim();

  if (!apiSecret) {
    throw new PaymentVerificationError('결제 검증 설정이 올바르지 않습니다.', 500);
  }

  if (!paymentId?.trim()) {
    throw new PaymentVerificationError('결제 거래 ID가 필요합니다.');
  }

  const response = await fetch(
    `${PORTONE_API_BASE_URL}/payments/${encodeURIComponent(paymentId.trim())}`,
    {
      headers: {
        Authorization: `PortOne ${apiSecret}`,
      },
    }
  );

  if (response.status === 404) {
    throw new PaymentVerificationError('결제 내역을 찾을 수 없습니다.');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new PaymentVerificationError(
      errorBody.message || '결제 정보를 확인할 수 없습니다.',
      response.status >= 500 ? 502 : 400
    );
  }

  const payment = await response.json();

  if (payment.status !== 'PAID') {
    throw new PaymentVerificationError('결제가 완료되지 않았습니다.');
  }

  const paidAmount = payment.amount?.total;
  const chargeAmount = getChargeAmount(expectedAmount);

  if (typeof paidAmount !== 'number' || paidAmount !== chargeAmount) {
    throw new PaymentVerificationError('결제 금액이 주문 금액과 일치하지 않습니다.');
  }

  return payment;
};

module.exports = {
  PaymentVerificationError,
  getChargeAmount,
  verifyPortOnePayment,
};
