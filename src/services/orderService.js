const STORAGE_KEY_ORDERS = "novella_demo_orders";

const initialOrders = [
  {
    id: "NOV-84920",
    customer: {
      fullName: "Tanvir Ahmed",
      phone: "+880 1712 345678",
      email: "tanvir.ahmed@example.com",
      address: "House 42, Road 11, Block D, Banani",
      district: "Dhaka",
      area: "Banani",
      notes: "Please call before arrival"
    },
    items: [
      {
        id: "prod-001",
        name: "KitKat Rich Matcha Green Tea Chocolate Bar (12 Mini Packs)",
        price: 720,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "prod-009",
        name: "Samyang Carbonara Spicy Buldak Ramen Pink Edition (5-Pack)",
        price: 840,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80"
      }
    ],
    subtotal: 2280,
    discount: 228,
    shippingFee: 120,
    total: 2172,
    couponCode: "IMPORT10",
    paymentMethod: "Cash on Delivery",
    status: "Delivered",
    createdAt: "2026-10-12T10:30:00.000Z",
    history: [
      { status: "Order Placed", time: "2026-10-12 10:30 AM", note: "Order placed successfully (Demo)" },
      { status: "Confirmed", time: "2026-10-12 11:15 AM", note: "Verified by phone confirmation" },
      { status: "Processing", time: "2026-10-12 02:00 PM", note: "Packed at Gulshan fulfillment center" },
      { status: "Shipped", time: "2026-10-13 09:30 AM", note: "Dispatched via Express Courier" },
      { status: "Delivered", time: "2026-10-13 04:45 PM", note: "Handed over to customer" }
    ]
  },
  {
    id: "NOV-84921",
    customer: {
      fullName: "Nusrat Jahan",
      phone: "+880 1819 876543",
      email: "nusrat.jahan@example.com",
      address: "Apartment 5B, Navana Tower, Gulshan-2",
      district: "Dhaka",
      area: "Gulshan",
      notes: ""
    },
    items: [
      {
        id: "prod-020",
        name: "Olaplex No. 4 Bond Maintenance Restorative Shampoo 250ml",
        price: 3290,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "prod-024",
        name: "CeraVe Hydrating Facial Cleanser for Normal to Dry Skin 473ml",
        price: 2190,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80"
      }
    ],
    subtotal: 5480,
    discount: 500,
    shippingFee: 0,
    total: 4980,
    couponCode: "WELCOME500",
    paymentMethod: "bKash Online (Demo Only)",
    status: "Shipped",
    createdAt: "2026-10-13T14:20:00.000Z",
    history: [
      { status: "Order Placed", time: "2026-10-13 02:20 PM", note: "Order placed successfully (Demo)" },
      { status: "Confirmed", time: "2026-10-13 03:00 PM", note: "Payment verified" },
      { status: "Processing", time: "2026-10-13 06:15 PM", note: "Packed with bubble wrap" },
      { status: "Shipped", time: "2026-10-14 10:00 AM", note: "In transit with courier" }
    ]
  },
  {
    id: "NOV-84922",
    customer: {
      fullName: "Rahim Chowdhury",
      phone: "+880 1911 223344",
      email: "rahim.c@example.com",
      address: "Plot 18, Road 4, Sector 7, Uttara",
      district: "Dhaka",
      area: "Uttara",
      notes: "Leave with security if not available"
    },
    items: [
      {
        id: "prod-026",
        name: "Horlicks Traditional Malted Drink Jar 500g (UK Imported)",
        price: 1290,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "prod-015",
        name: "Quaker Quick Cooking Rolled Wholegrain Oats 1kg Tub",
        price: 750,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80"
      }
    ],
    subtotal: 4080,
    discount: 0,
    shippingFee: 0,
    total: 4080,
    couponCode: null,
    paymentMethod: "Cash on Delivery",
    status: "Processing",
    createdAt: "2026-10-14T08:45:00.000Z",
    history: [
      { status: "Order Placed", time: "2026-10-14 08:45 AM", note: "Order placed successfully (Demo)" },
      { status: "Confirmed", time: "2026-10-14 09:30 AM", note: "Confirmed by admin" },
      { status: "Processing", time: "2026-10-14 11:00 AM", note: "Being packed at warehouse" }
    ]
  },
  {
    id: "NOV-84923",
    customer: {
      fullName: "Farhana Karim",
      phone: "+880 1622 998877",
      email: "farhana.k@example.com",
      address: "House 12, GEC Circle, Nasirabad",
      district: "Chittagong",
      area: "GEC",
      notes: ""
    },
    items: [
      {
        id: "prod-031",
        name: "Nike Air Jordan 1 Low 'Panda' White & Black (Imported)",
        price: 13999,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80"
      }
    ],
    subtotal: 13999,
    discount: 1399,
    shippingFee: 0,
    total: 12600,
    couponCode: "IMPORT10",
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    createdAt: "2026-10-14T11:15:00.000Z",
    history: [
      { status: "Order Placed", time: "2026-10-14 11:15 AM", note: "Order received via storefront" }
    ]
  }
];

function getStoredOrders() {
  if (typeof window === "undefined") return initialOrders;
  try {
    const item = localStorage.getItem(STORAGE_KEY_ORDERS);
    return item ? JSON.parse(item) : initialOrders;
  } catch {
    return initialOrders;
  }
}

function saveOrders(orders) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn("Could not save orders", e);
    }
  }
}

export const orderService = {
  async getAllOrders() {
    return getStoredOrders();
  },

  async getOrderById(id) {
    const orders = getStoredOrders();
    const cleanId = id.toUpperCase().trim();
    return orders.find(o => o.id === cleanId) || null;
  },

  async trackOrder(orderId, phone = "") {
    const orders = getStoredOrders();
    const cleanId = orderId.toUpperCase().trim();
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    return orders.find(o => {
      const idMatch = o.id === cleanId;
      if (!phone) return idMatch;
      const orderPhoneClean = o.customer.phone.replace(/[^0-9]/g, "");
      return idMatch && (orderPhoneClean.includes(cleanPhone) || cleanPhone.includes(orderPhoneClean));
    }) || null;
  },

  async createOrder(orderData) {
    const orders = getStoredOrders();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newOrder = {
      id: `NOV-${randomNum}`,
      ...orderData,
      status: "Pending",
      createdAt: new Date().toISOString(),
      history: [
        {
          status: "Order Placed",
          time: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          note: "Order placed via website checkout (Demo)"
        }
      ]
    };
    const updated = [newOrder, ...orders];
    saveOrders(updated);
    return newOrder;
  },

  async updateOrderStatus(id, newStatus) {
    const orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error("Order not found");

    const timeStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    orders[index].status = newStatus;
    orders[index].history = [
      ...orders[index].history,
      {
        status: newStatus,
        time: timeStr,
        note: `Status updated to ${newStatus} by administrator`
      }
    ];

    saveOrders(orders);
    return orders[index];
  }
};
