
export const USERS = {
    me: {
        id: 'u1',
        name: 'Sarah',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAigth2QvzKuPyxvlqDuxR1Y4praIaYx84Oi3dLB7r3GhwhUQGjcnKxSuKdTy_U9guRX_ciJwefSs97RbIQlMvROLE4S3Lvv_V8W8E4x2IGgAjGDjjHoVJl84492_vCV1nPNgp4jEVxqL54T66MYpBwlcrNOdz75K11isOmc_i-V_RBHoQmz_ma0odEi4bo90Wla47lzjQ23AcMmH5S0q5FKXcXNr_uxMqTNzxvOpbIvQ7rkAd6faQEn2B0O8yyThl_pnXhnG9XIG8C',
    },
    seller: {
        id: 'u2',
        name: "Matilda's Archive",
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbYZn4PYDPWcCOUnAX9PRCGxv7a1uA9GeihlQQb5ou5Od4pU0DyJPSgFD6-bztbqJ274JySAnj7hyRjzmOfKV6jEmNG-Q4wf0T0RBiS-cqKEmQnNSg0_VfY85Cx437tPM4YmSj8EAFy4bd9V96TH7Rzi46fS_kpyojWQPk16L15IFfSDpyFaaYn0Mo3xiHfh0sH0HFMNOVvSkNckmERZb2ktAwaDgu4bVA_Yl6JSsRdn6WKvFIkNT484O1xletbz6NNMVYQPIvxqpm',
        meta: 'Brooklyn, NY • Active now',
        positiveRate: 98,
        rating: 4.9,
        sales: 154,
        shipTime: '24h',
        bio: 'Rescuing 70s denim and chunky knits. Every item is cleaned with eco-friendly products and packed with recycled materials.',
    },
    chatUser: {
        id: 'u3',
        name: 'Sarah J.',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASkki48k7Y_GiD_qkNOaOZN4B_ps1X8Ti8XofNsGyFTibiK0unE51r_0GLVezIaKhAUSzund9mfVao0dk8L3qlHt_PyTIj7hQ6P8Tt5C18lJjLlTwW2bCKGdssTc6OQrlt_fg8iisj4URb5hDtYvVqPa4ozDYLmj2XDGkakMu5xUIQZfnu-9PTxsIAHxBnIC8s0QBOw2mtYfUE-osx2TyPsScFr5cXDNXXqbKFOei7SgTSkOsZURrmBqYHe43KQ_5X_YgIJpCCXb9X',
        online: 'Online now',
    },
};

export const PRODUCTS = [
    {
        id: 'p1',
        name: "Vintage Levi's Trucker Jacket",
        meta: 'Size M • Excellent Condition',
        price: '$45.00',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyzPmqR0xA6If0DoO4Sk0x0KxD_sOdhBimE6C1Ctf0W4EryqqEMuo7SDV7wxOgr3NlmNE5hp1dYNmh7LCNytzPtEPCaBUl5kNouptG41S2gjMjJ02ePSRUVU8CnfQIAqwQ-09H4pgoVkrIu0W82mTNJjyawubCXugSXPJ_dWPvTHaTxsgjKZl4pwR_W_nXf41m2FYVQcSrgYRlOiLeXaMoyZ4I3uomIIVFb49h_JKDtdQB1amgcbOZgRhaB6UdD6-YM8PtERah5njJ',
        isTrusted: true,
    },
    {
        id: 'p2',
        name: "Nike Air Force 1 '07",
        meta: 'Size 9 • Like New',
        price: '$120.00',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8T1VkruuM1mC2TmA1TmobG1wxO-5j3P_srTQlThS4L4fUm2FlmliRDEGWQmdWgLtf-T8QF3RLQCwQZoe8jLhEoMepLo-sdLjyucBxwMTdPI3Z8k60I0U8irbGc7k7yQ3fCkccv6xI8NnaRiMFyDeDG_B4QRKu2N-aFgXu4QhcBld6WGUFUxB6HjWtMB7JKn5jEIgkf--MRsbZFFS6OBcD9vDybZZHtlawHd63OmAseRD4OXJeb1gY9ID57LuMayVXZFL6KhGTZYzK',
        isTrusted: true,
    },
    {
        id: 'p3',
        name: 'Vintage Heritage Trench Coat',
        meta: 'Size L • Premium',
        price: '$845.00',
        oldPrice: '$1,250.00',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUghUQQPMsVltJ9By15ZQJ446-gIZiOOjWuioELYN-4lR_-wp5KGvw1qgvgLlRQodRn_Qpw2A0br88t8VCWtK_RbbqvsP1BOzzxRYXLz0QXBFgDL2Agppyg7nGQiTtUHgNvfjZswzmg-x9rfFY6CVUuwWCa2mAu80_ZAEFtrdq_xKEfzZJziTGxKY7m3odZWI4zJkZ9_w3zT7vy2AgnNJhtgYVM3rWwp5dKwA7mUUIFPXRTrMU7-5acnCrUAX25zcEpD5wyV0plq1M',
        isTrusted: true,
        isPremium: true,
        description: 'Rare beige trench coat in excellent condition. Structured shoulders, belt included, and original lining intact.',
        sellerId: 'u2',
    },
];

export const CHATS = [
    {
        id: 'c1',
        sender: 'system',
        text: 'Both users agreed on time and location through in-app chat.',
        title: 'Verified Meetup Details',
    },
    {
        id: 'c2',
        sender: 'other',
        text: 'Perfect, does 2:00 PM work for you?',
    },
    {
        id: 'c3',
        sender: 'me',
        text: 'Yes, I will be there.',
    },
    {
        id: 'c4',
        sender: 'other',
        text: 'Great. I will bring the sneakers and original box.',
    },
];

export const CATEGORIES = [
    { id: 'fashion', label: 'Fashion' },
    { id: 'tech', label: 'Tech' },
    { id: 'home', label: 'Home' },
    { id: 'kids', label: 'Kids' },
];

export const FRESH_FINDS = [
    {
        id: 'f1',
        name: 'Canon AE-1 Program',
        price: '€150',
        time: '2h ago',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 'f2',
        name: 'North Face Backpack',
        price: '€65',
        time: '10m ago',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 'f3',
        name: 'Cotton Essentials...',
        price: '€12',
        time: '5h ago',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 'f4',
        name: 'Sony XM4 Wireless',
        price: '€210',
        time: '3h ago',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 'f5',
        name: 'Apple Watch SE',
        price: '€180',
        time: '1d ago',
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 'f6',
        name: 'MacBook Air M1',
        price: '€700',
        time: '6h ago',
        image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=1000&auto=format&fit=crop',
    },
    // More items for infinite scroll simulation
    { id: 'f7', name: 'Vintage Polaroid', price: '€85', time: '8h ago', image: 'https://images.unsplash.com/photo-1526170315873-3a91e5ee057a?q=80&w=1000&auto=format&fit=crop' },
    { id: 'f8', name: 'Leather Boots', price: '€120', time: '12h ago', image: 'https://images.unsplash.com/photo-1520639889410-d65c39fdceae?q=80&w=1000&auto=format&fit=crop' },
    { id: 'f9', name: 'Minimalist Desk Lamp', price: '€45', time: '1d ago', image: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=1000&auto=format&fit=crop' },
    { id: 'f10', name: 'Analog Record Player', price: '€195', time: '2d ago', image: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?q=80&w=1000&auto=format&fit=crop' },
];

export interface PaginatedResult<T> {
    items: T[];
    nextCursor: string | null;
}

export const fetchFreshFinds = async (cursor: string | null, limit: number = 4): Promise<PaginatedResult<any>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const startIndex = cursor ? FRESH_FINDS.findIndex(item => item.id === cursor) + 1 : 0;
    const items = FRESH_FINDS.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < FRESH_FINDS.length ? items[items.length - 1].id : null;

    return {
        items,
        nextCursor
    };
};
