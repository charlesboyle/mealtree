/**
 * Placeholder data. Every restaurant here is fictional; images are Unsplash
 * photo ids resolved by `photoUrl` in `src/lib/format.ts`.
 */
import type { Restaurant } from "@/lib/types";
import { schedule, stats } from "./helpers";

const NEIGHBORHOOD = "Mission District";
const TZ = "America/Los_Angeles";

export const restaurants: Restaurant[] = [
  {
    slug: "komori-ramen",
    name: "Kōmori Ramen",
    tagline: "Slow-simmered tonkotsu and small plates, open late.",
    cuisine: ["Japanese", "Ramen"],
    priceLevel: 2,
    neighborhood: NEIGHBORHOOD,
    address: "2184 Mission St, San Francisco, CA 94110",
    phone: "+14155550142",
    timezone: TZ,
    accent: "#C2412D",
    cover: "1569718212165-3a8278d5f624",
    hours: schedule([["11:30", "15:00"], ["17:00", "23:30"]], {
      closed: [1],
      overrides: { 5: [["11:30", "15:00"], ["17:00", "01:30"]], 6: [["12:00", "01:30"]] },
    }),
    links: [
      { kind: "reserve", label: "Join waitlist", url: "https://example.com/waitlist" },
      { kind: "order", label: "Order pickup", url: "https://example.com/order" },
      { kind: "instagram", label: "Instagram", url: "https://instagram.com/" },
    ],
    claimed: false,
    source: "visit",
    verifiedAt: "2026-09-18",
    googleMenuLink: false,
    menus: [
      {
        id: "food",
        name: "Food",
        sections: [
          {
            id: "ramen",
            name: "Ramen",
            description: "All bowls come with a soft egg. Extra noodles (kaedama) +$3.",
            items: [
              {
                id: "tonkotsu-classic",
                name: "Tonkotsu Classic",
                description: "18-hour pork bone broth, chashu belly, wood ear, scallion, black garlic oil.",
                price: 18,
                image: "1569718212165-3a8278d5f624",
                popular: true,
                addOns: [
                  { label: "Extra chashu", price: 5 },
                  { label: "Kaedama (extra noodles)", price: 3 },
                  { label: "Corn butter", price: 2 },
                ],
              },
              {
                id: "spicy-miso",
                name: "Spicy Red Miso",
                description: "Blended miso tare, ground pork, bean sprouts, chili threads, sesame.",
                price: 19,
                image: "1557872943-16a5ac26437e",
                tags: ["spicy"],
                popular: true,
                variants: [
                  { label: "Mild", price: 19 },
                  { label: "Hot", price: 19 },
                  { label: "Kōmori hot", price: 20 },
                ],
              },
              {
                id: "yuzu-shio",
                name: "Yuzu Shio",
                description: "Clear chicken broth, sea salt tare, yuzu peel, chicken chashu, menma.",
                price: 18,
              },
              {
                id: "vegan-tantan",
                name: "Vegan Tantanmen",
                description: "Sesame-soy milk broth, crumbled tofu, bok choy, chili oil. No egg.",
                price: 17,
                tags: ["vegan", "spicy", "nuts"],
              },
              {
                id: "tsukemen",
                name: "Tsukemen",
                description: "Thick dipping noodles with a rich, reduced fish-pork broth on the side.",
                price: 20,
                soldOut: true,
              },
            ],
          },
          {
            id: "small-plates",
            name: "Small Plates",
            items: [
              {
                id: "gyoza",
                name: "Pan-Fried Gyoza",
                description: "Six pork and cabbage dumplings, crisp lace skirt, ponzu.",
                price: 9,
                image: "1496116218417-1a781b1c416c",
                popular: true,
              },
              {
                id: "karaage",
                name: "Chicken Karaage",
                description: "Ginger-soy marinated thigh, lemon, kewpie.",
                price: 11,
              },
              {
                id: "edamame",
                name: "Garlic Edamame",
                description: "Blistered in the wok with garlic and flaky salt.",
                price: 7,
                tags: ["vegan", "gluten-free"],
              },
              {
                id: "chashu-bun",
                name: "Chashu Bao",
                description: "Two steamed buns, braised pork belly, pickled cucumber, hoisin.",
                price: 10,
                image: "1563245372-f21724e3856d",
              },
            ],
          },
          {
            id: "rice",
            name: "Rice",
            items: [
              {
                id: "chashu-don",
                name: "Chashu Don",
                description: "Torched pork belly over rice with a jammy egg and scallion.",
                price: 14,
              },
              {
                id: "curry-rice",
                name: "Japanese Curry Rice",
                description: "House roux, potatoes, carrots, pickles.",
                price: 13,
                tags: ["vegetarian"],
              },
            ],
          },
        ],
      },
      {
        id: "drinks",
        name: "Drinks",
        sections: [
          {
            id: "beer-sake",
            name: "Beer & Sake",
            items: [
              { id: "sapporo", name: "Sapporo Draft", price: 7, variants: [{ label: "Glass", price: 7 }, { label: "Pitcher", price: 24 }] },
              { id: "house-sake", name: "House Junmai Sake", description: "Served chilled.", price: 9, variants: [{ label: "Glass", price: 9 }, { label: "Carafe", price: 22 }] },
              { id: "yuzu-highball", name: "Yuzu Highball", description: "Japanese whisky, yuzu, soda.", price: 13, image: "1514362545857-3bc16c4c7d1b" },
            ],
          },
          {
            id: "soft",
            name: "Non-Alcoholic",
            items: [
              { id: "ramune", name: "Ramune", description: "Original or melon.", price: 4 },
              { id: "iced-matcha", name: "Iced Matcha", price: 5, tags: ["vegan"] },
            ],
          },
        ],
      },
    ],
    stats: stats("komori-ramen", 42),
  },

  {
    slug: "el-faro-azul",
    name: "Taquería El Faro Azul",
    tagline: "Mission-style burritos and tacos al pastor off the trompo.",
    cuisine: ["Mexican", "Taquería"],
    priceLevel: 1,
    neighborhood: NEIGHBORHOOD,
    address: "3011 24th St, San Francisco, CA 94110",
    phone: "+14155550187",
    timezone: TZ,
    accent: "#1E5BB8",
    cover: "1565299585323-38d6b0865b47",
    hours: schedule([["10:00", "22:00"]], { overrides: { 5: [["10:00", "02:00"]], 6: [["10:00", "02:00"]] } }),
    links: [
      { kind: "order", label: "Order delivery", url: "https://example.com/order" },
      { kind: "whatsapp", label: "WhatsApp", url: "https://wa.me/14155550187" },
    ],
    claimed: false,
    source: "photos",
    verifiedAt: "2026-09-02",
    googleMenuLink: false,
    menus: [
      {
        id: "menu",
        name: "Menu",
        note: "Cash and card accepted. Tortillas made in-house daily.",
        sections: [
          {
            id: "tacos",
            name: "Tacos",
            description: "Corn tortillas, onion, cilantro, salsa. Add cheese or avocado +$1.",
            items: [
              { id: "al-pastor", name: "Al Pastor", description: "Achiote pork off the spit, pineapple.", price: 4.5, image: "1551504734-5ee1c4a1479b", popular: true, tags: ["gluten-free"] },
              { id: "carne-asada", name: "Carne Asada", description: "Grilled marinated steak.", price: 5, tags: ["gluten-free"] },
              { id: "carnitas", name: "Carnitas", description: "Slow-braised pork, crispy edges.", price: 4.5, tags: ["gluten-free"] },
              { id: "pescado", name: "Baja Fish", description: "Beer-battered rockfish, cabbage, chipotle crema.", price: 5.5, image: "1599974579688-8dbdd335c77f" },
              { id: "hongos", name: "Hongos", description: "Roasted mushrooms, epazote, queso fresco.", price: 4.5, tags: ["vegetarian", "gluten-free"] },
            ],
          },
          {
            id: "burritos",
            name: "Burritos",
            description: "Rice, beans, salsa, and your choice of meat in a flour tortilla.",
            items: [
              {
                id: "super-burrito",
                name: "Super Burrito",
                description: "With cheese, sour cream, and guacamole. The one everyone orders.",
                price: 14,
                popular: true,
                variants: [
                  { label: "Regular", price: 14 },
                  { label: "Super", price: 16 },
                  { label: "Dorado (crisped)", price: 17 },
                ],
              },
              { id: "veggie-burrito", name: "Veggie Burrito", description: "Grilled peppers, onions, mushrooms, black beans.", price: 12, tags: ["vegetarian"] },
              { id: "california", name: "California Burrito", description: "Carne asada, fries, cheese, crema. No rice, no beans.", price: 15.5 },
            ],
          },
          {
            id: "plates",
            name: "Plates",
            items: [
              { id: "quesabirria", name: "Quesabirria (3)", description: "Crisp cheese tacos with a cup of consommé for dipping.", price: 16, popular: true },
              { id: "enchiladas", name: "Enchiladas Verdes", description: "Chicken, salsa verde, crema, rice and beans.", price: 15 },
              { id: "nachos", name: "Super Nachos", description: "For two, or one very determined person.", price: 13 },
            ],
          },
          {
            id: "drinks",
            name: "Drinks",
            items: [
              { id: "horchata", name: "Horchata", price: 3.5, variants: [{ label: "Medium", price: 3.5 }, { label: "Large", price: 4.5 }] },
              { id: "jamaica", name: "Agua de Jamaica", price: 3.5, tags: ["vegan"] },
              { id: "jarritos", name: "Jarritos", description: "Mandarin, tamarind, lime, or pineapple.", price: 3 },
            ],
          },
        ],
      },
    ],
    stats: stats("el-faro-azul", 61),
  },

  {
    slug: "nonna-lucia",
    name: "Nonna Lucia",
    tagline: "Wood-fired Neapolitan pizza and fresh pasta.",
    cuisine: ["Italian", "Pizza"],
    priceLevel: 2,
    neighborhood: NEIGHBORHOOD,
    address: "815 Valencia St, San Francisco, CA 94110",
    phone: "+14155550133",
    timezone: TZ,
    accent: "#2F6B3A",
    cover: "1574071318508-1cdbab80d002",
    hours: schedule([["17:00", "22:00"]], { closed: [2], overrides: { 5: [["17:00", "23:00"]], 6: [["12:00", "23:00"]], 0: [["12:00", "21:30"]] } }),
    links: [
      { kind: "reserve", label: "Book a table", url: "https://example.com/reserve" },
      { kind: "website", label: "Website", url: "https://example.com" },
      { kind: "instagram", label: "Instagram", url: "https://instagram.com/" },
    ],
    claimed: true,
    source: "owner",
    verifiedAt: "2026-09-24",
    googleMenuLink: true,
    menus: [
      {
        id: "dinner",
        name: "Dinner",
        sections: [
          {
            id: "antipasti",
            name: "Antipasti",
            items: [
              { id: "burrata", name: "Burrata", description: "Heirloom tomato, basil oil, grilled bread.", price: 17, tags: ["vegetarian"], popular: true },
              { id: "arancini", name: "Arancini", description: "Saffron risotto, fior di latte, marinara.", price: 12, tags: ["vegetarian"] },
              { id: "polpette", name: "Polpette", description: "Beef and pork meatballs in sugo, parmigiano.", price: 14 },
            ],
          },
          {
            id: "pizza",
            name: "Pizza",
            description: "12\" wood-fired. Gluten-free crust available +$4.",
            items: [
              { id: "margherita", name: "Margherita", description: "San Marzano, fior di latte, basil, olive oil.", price: 19, image: "1574071318508-1cdbab80d002", tags: ["vegetarian"], popular: true },
              { id: "diavola", name: "Diavola", description: "Spicy soppressata, chili honey, mozzarella.", price: 23, image: "1565299624946-b28f40a0ae38", tags: ["spicy"], popular: true },
              { id: "funghi", name: "Funghi", description: "Wild mushrooms, fontina, thyme, garlic cream.", price: 22, image: "1513104890138-7c749659a591", tags: ["vegetarian"] },
              { id: "marinara", name: "Marinara", description: "Tomato, garlic, oregano. No cheese.", price: 16, tags: ["vegan"] },
              { id: "salsiccia", name: "Salsiccia e Friarielli", description: "Fennel sausage, broccoli rabe, smoked provola.", price: 24 },
            ],
          },
          {
            id: "pasta",
            name: "Pasta",
            description: "Made in-house every morning.",
            items: [
              { id: "cacio-e-pepe", name: "Cacio e Pepe", description: "Tonnarelli, pecorino romano, toasted pepper.", price: 21, image: "1473093295043-cdd812d0e601", tags: ["vegetarian"] },
              { id: "rigatoni-vodka", name: "Rigatoni alla Vodka", description: "Tomato cream, calabrian chili, parmigiano.", price: 22, image: "1551183053-bf91a1d81141", tags: ["spicy", "vegetarian"], popular: true },
              { id: "pappardelle", name: "Pappardelle Ragù", description: "Slow-braised short rib ragù, gremolata.", price: 26 },
            ],
          },
          {
            id: "dolci",
            name: "Dolci",
            items: [
              { id: "tiramisu", name: "Tiramisù", description: "Espresso-soaked savoiardi, mascarpone, cocoa.", price: 11, image: "1571877227200-a0d98ea607e9", tags: ["vegetarian"] },
              { id: "affogato", name: "Affogato", description: "Fior di latte gelato, a shot of espresso.", price: 8, tags: ["vegetarian", "gluten-free"] },
            ],
          },
        ],
      },
    ],
    stats: stats("nonna-lucia", 55),
  },

  {
    slug: "saffron-and-sumac",
    name: "Saffron & Sumac",
    tagline: "Levantine grill, mezze, and flatbreads from the taboon oven.",
    cuisine: ["Middle Eastern", "Mediterranean"],
    priceLevel: 2,
    neighborhood: NEIGHBORHOOD,
    address: "3350 18th St, San Francisco, CA 94110",
    phone: "+14155550166",
    timezone: TZ,
    accent: "#B7791F",
    cover: "1577805947697-89e18249d767",
    hours: schedule([["11:00", "21:30"]], { overrides: { 5: [["11:00", "22:30"]], 6: [["11:00", "22:30"]] } }),
    links: [
      { kind: "order", label: "Order pickup", url: "https://example.com/order" },
      { kind: "instagram", label: "Instagram", url: "https://instagram.com/" },
    ],
    claimed: false,
    source: "photos",
    verifiedAt: "2026-08-21",
    googleMenuLink: false,
    menus: [
      {
        id: "menu",
        name: "Menu",
        sections: [
          {
            id: "mezze",
            name: "Mezze",
            description: "Served with warm taboon bread.",
            items: [
              { id: "hummus", name: "Hummus", description: "Tahini, lemon, olive oil, paprika.", price: 10, tags: ["vegan", "gluten-free"], popular: true, image: "1577805947697-89e18249d767" },
              { id: "baba-ghanoush", name: "Baba Ghanoush", description: "Fire-charred eggplant, pomegranate, mint.", price: 11, tags: ["vegan", "gluten-free"] },
              { id: "muhammara", name: "Muhammara", description: "Roasted red pepper, walnut, pomegranate molasses.", price: 11, tags: ["vegan", "nuts"] },
              { id: "falafel", name: "Falafel (6)", description: "Herb-green inside, crisp outside, tahini.", price: 10, tags: ["vegan"] },
              { id: "mezze-trio", name: "Mezze Trio", description: "Pick any three.", price: 26, tags: ["vegetarian"] },
            ],
          },
          {
            id: "grill",
            name: "From the Grill",
            description: "Plates come with saffron rice, fattoush, and garlic toum.",
            items: [
              { id: "shish-taouk", name: "Shish Taouk", description: "Yogurt-marinated chicken skewers.", price: 22, popular: true, tags: ["gluten-free"] },
              { id: "kofta", name: "Lamb Kofta", description: "Spiced ground lamb, sumac onions, parsley.", price: 25, tags: ["gluten-free"] },
              { id: "mixed-grill", name: "Mixed Grill for Two", description: "Taouk, kofta, beef shawarma, all the sides.", price: 54 },
              { id: "halloumi", name: "Grilled Halloumi", description: "Za'atar, honey, charred lemon.", price: 19, tags: ["vegetarian", "gluten-free"] },
            ],
          },
          {
            id: "flatbreads",
            name: "Flatbreads",
            items: [
              { id: "manakish", name: "Za'atar Manakish", description: "Za'atar, olive oil, tomato, mint.", price: 12, tags: ["vegan"] },
              { id: "lahm-bi-ajeen", name: "Lahm bi Ajeen", description: "Spiced minced lamb, pine nuts, lemon.", price: 15, tags: ["nuts"] },
            ],
          },
          {
            id: "sweets",
            name: "Sweets & Tea",
            items: [
              { id: "knafeh", name: "Knafeh", description: "Warm cheese pastry, orange-blossom syrup, pistachio.", price: 10, tags: ["vegetarian", "nuts"], popular: true },
              { id: "mint-tea", name: "Fresh Mint Tea", price: 4.5, tags: ["vegan"] },
              { id: "cardamom-coffee", name: "Cardamom Coffee", price: 4.5, tags: ["vegan"] },
            ],
          },
        ],
      },
    ],
    stats: stats("saffron-and-sumac", 28),
  },

  {
    slug: "banh-mi-ba-nam",
    name: "Bánh Mì Bà Năm",
    tagline: "Crackly baguettes, bright pickles, and pho on weekends.",
    cuisine: ["Vietnamese", "Sandwiches"],
    priceLevel: 1,
    neighborhood: NEIGHBORHOOD,
    address: "2701 Folsom St, San Francisco, CA 94110",
    phone: "+14155550119",
    timezone: TZ,
    accent: "#3F7D58",
    cover: "1582878826629-29b7ad1cdc43",
    hours: schedule([["09:00", "17:00"]], { closed: [3] }),
    links: [{ kind: "order", label: "Order pickup", url: "https://example.com/order" }],
    claimed: false,
    source: "visit",
    verifiedAt: "2026-09-20",
    googleMenuLink: false,
    menus: [
      {
        id: "menu",
        name: "Menu",
        note: "Cash only. Pho served Saturday and Sunday until sold out.",
        sections: [
          {
            id: "banh-mi",
            name: "Bánh Mì",
            description: "Pâté, mayo, pickled daikon and carrot, cucumber, cilantro, jalapeño.",
            items: [
              { id: "dac-biet", name: "Đặc Biệt (House Special)", description: "Ham, head cheese, pork roll, pâté.", price: 9, popular: true },
              { id: "lemongrass-pork", name: "Lemongrass Grilled Pork", price: 9.5, popular: true, image: "1509722747041-616f39b57569" },
              { id: "chicken", name: "Five-Spice Chicken", price: 9 },
              { id: "tofu", name: "Crispy Lemongrass Tofu", description: "Vegan mayo, no pâté.", price: 8.5, tags: ["vegan"] },
              { id: "meatball", name: "Xíu Mại Meatball", description: "Pork meatballs in tomato sauce.", price: 9.5 },
            ],
          },
          {
            id: "bowls",
            name: "Bowls",
            items: [
              {
                id: "pho-bo",
                name: "Phở Bò",
                description: "Beef broth, rare steak, brisket, rice noodles, herbs. Weekends only.",
                price: 16,
                image: "1582878826629-29b7ad1cdc43",
                tags: ["gluten-free"],
                variants: [
                  { label: "Small", price: 14 },
                  { label: "Large", price: 16 },
                ],
              },
              { id: "bun-thit-nuong", name: "Bún Thịt Nướng", description: "Vermicelli, grilled pork, egg roll, nước chấm.", price: 15 },
              { id: "com-ga", name: "Cơm Gà", description: "Chicken rice, ginger scallion sauce, broth.", price: 14 },
            ],
          },
          {
            id: "sides",
            name: "Sides",
            items: [
              { id: "spring-rolls", name: "Gỏi Cuốn (2)", description: "Shrimp and pork summer rolls, peanut sauce.", price: 8, tags: ["gluten-free", "nuts"] },
              { id: "egg-rolls", name: "Chả Giò (4)", description: "Crispy pork and taro egg rolls.", price: 8 },
            ],
          },
          {
            id: "drinks",
            name: "Drinks",
            items: [
              { id: "ca-phe-sua-da", name: "Cà Phê Sữa Đá", description: "Vietnamese iced coffee, condensed milk.", price: 6, popular: true },
              { id: "salted-lemonade", name: "Salted Plum Lemonade", price: 5, tags: ["vegan"] },
            ],
          },
        ],
      },
    ],
    stats: stats("banh-mi-ba-nam", 33),
  },

  {
    slug: "little-fern",
    name: "Little Fern Café",
    tagline: "Neighborhood coffee, all-day breakfast, natural wine after five.",
    cuisine: ["Café", "Brunch"],
    priceLevel: 2,
    neighborhood: NEIGHBORHOOD,
    address: "1024 Guerrero St, San Francisco, CA 94110",
    phone: "+14155550108",
    timezone: TZ,
    accent: "#5F7A61",
    cover: "1501339847302-ac426a4a7cbb",
    hours: schedule([["07:00", "16:00"]], { overrides: { 4: [["07:00", "21:00"]], 5: [["07:00", "21:00"]], 6: [["08:00", "21:00"]], 0: [["08:00", "16:00"]] } }),
    links: [
      { kind: "website", label: "Website", url: "https://example.com" },
      { kind: "instagram", label: "Instagram", url: "https://instagram.com/" },
    ],
    claimed: false,
    source: "website",
    verifiedAt: "2026-09-10",
    googleMenuLink: true,
    menus: [
      {
        id: "all-day",
        name: "All Day",
        sections: [
          {
            id: "breakfast",
            name: "Breakfast",
            items: [
              { id: "avocado-toast", name: "Avocado Toast", description: "Country sourdough, chili crunch, soft egg, herbs.", price: 15, image: "1482049016688-2d3e1b311543", tags: ["vegetarian", "spicy"], popular: true },
              { id: "ricotta-pancakes", name: "Ricotta Pancakes", description: "Lemon curd, blueberries, maple.", price: 16, image: "1567620905732-2d1ec7ab7445", tags: ["vegetarian"] },
              { id: "french-toast", name: "Brioche French Toast", description: "Seasonal fruit, whipped crème fraîche.", price: 16, image: "1484723091739-30a097e8f929", tags: ["vegetarian"] },
              { id: "fern-scramble", name: "Fern Scramble", description: "Soft eggs, chives, gruyère, greens, toast.", price: 14, tags: ["vegetarian"] },
              { id: "granola", name: "House Granola", description: "Greek yogurt, honey, stone fruit.", price: 11, tags: ["vegetarian", "nuts", "gluten-free"] },
            ],
          },
          {
            id: "lunch",
            name: "Lunch",
            description: "From 11am.",
            items: [
              { id: "grain-bowl", name: "Green Goddess Grain Bowl", description: "Farro, roasted squash, kale, pickled onion, feta.", price: 17, tags: ["vegetarian"] },
              { id: "chicken-sandwich", name: "Chicken Milanese Sandwich", description: "Arugula, lemon aioli, focaccia.", price: 17 },
              { id: "soup", name: "Soup of the Day", description: "Ask us. It's usually good.", price: null, priceNote: "Market price" },
            ],
          },
          {
            id: "coffee",
            name: "Coffee & Tea",
            description: "Oat, almond, or whole milk. Alt milk no charge.",
            items: [
              { id: "latte", name: "Latte", price: 5.5, image: "1541167760496-1628856ab772", variants: [{ label: "8 oz", price: 5.5 }, { label: "12 oz", price: 6.25 }] },
              { id: "cortado", name: "Cortado", price: 4.75 },
              { id: "drip", name: "Drip Coffee", price: 3.75, tags: ["vegan"] },
              { id: "matcha-latte", name: "Matcha Latte", price: 6.5 },
              { id: "chai", name: "House Chai", description: "Brewed with whole spices.", price: 6 },
            ],
          },
        ],
      },
      {
        id: "evening",
        name: "Evening",
        note: "Thursday to Saturday, 5–9pm.",
        sections: [
          {
            id: "wine",
            name: "Natural Wine",
            items: [
              { id: "skin-contact", name: "Skin-Contact Pinot Gris", description: "Oregon. Apricot, tea, a little funk.", price: 14, variants: [{ label: "Glass", price: 14 }, { label: "Bottle", price: 52 }] },
              { id: "chillable-red", name: "Chillable Gamay", description: "Sonoma. Bright, crunchy.", price: 13, variants: [{ label: "Glass", price: 13 }, { label: "Bottle", price: 48 }] },
              { id: "pet-nat", name: "Pét-Nat Rosé", description: "Lodi. Fizzy strawberry.", price: 15, image: "1544145945-f90425340c7e" },
            ],
          },
          {
            id: "snacks",
            name: "Snacks",
            items: [
              { id: "olives", name: "Warm Olives", description: "Citrus, fennel, chili.", price: 7, tags: ["vegan", "gluten-free"] },
              { id: "cheese", name: "Cheese Board", description: "Three cheeses, honeycomb, crackers.", price: 22, tags: ["vegetarian"] },
            ],
          },
        ],
      },
    ],
    stats: stats("little-fern", 38),
  },

  {
    slug: "seoul-smoke",
    name: "Seoul Smoke",
    tagline: "Tabletop charcoal BBQ, banchan, and late-night fried chicken.",
    cuisine: ["Korean", "BBQ"],
    priceLevel: 3,
    neighborhood: NEIGHBORHOOD,
    address: "2450 Harrison St, San Francisco, CA 94110",
    phone: "+14155550171",
    timezone: TZ,
    accent: "#1F1F24",
    cover: "1590301157890-4810ed352733",
    hours: schedule([["17:00", "23:00"]], { overrides: { 5: [["17:00", "00:30"]], 6: [["16:00", "00:30"]] } }),
    links: [
      { kind: "reserve", label: "Reserve", url: "https://example.com/reserve" },
      { kind: "instagram", label: "Instagram", url: "https://instagram.com/" },
    ],
    claimed: false,
    source: "photos",
    verifiedAt: "2026-07-30",
    googleMenuLink: false,
    menus: [
      {
        id: "menu",
        name: "Menu",
        note: "BBQ is a two-order minimum per table. Banchan refills are free.",
        sections: [
          {
            id: "bbq",
            name: "Charcoal BBQ",
            items: [
              { id: "galbi", name: "Galbi", description: "Soy-pear marinated beef short rib.", price: 42, popular: true, image: "1590301157890-4810ed352733" },
              { id: "samgyeopsal", name: "Samgyeopsal", description: "Thick-cut pork belly, sesame oil, salt.", price: 32 },
              { id: "bulgogi", name: "Bulgogi", description: "Thin-sliced ribeye, onion, scallion.", price: 34 },
              { id: "spicy-pork", name: "Gochujang Pork", description: "Pork shoulder in chili paste.", price: 30, tags: ["spicy"] },
              { id: "bbq-set", name: "Smoke Set for Two", description: "Galbi, pork belly, bulgogi, steamed egg, stew.", price: 98, popular: true },
            ],
          },
          {
            id: "kitchen",
            name: "Kitchen",
            items: [
              { id: "bibimbap", name: "Dolsot Bibimbap", description: "Hot stone rice, vegetables, egg, gochujang.", price: 21, image: "1553163147-622ab57be1c7", tags: ["vegetarian", "spicy"] },
              { id: "kimchi-jjigae", name: "Kimchi Jjigae", description: "Aged kimchi, pork, tofu, served bubbling.", price: 19, tags: ["spicy"] },
              { id: "japchae", name: "Japchae", description: "Sweet potato glass noodles, vegetables, sesame.", price: 18, tags: ["vegan", "gluten-free"] },
              { id: "seafood-pancake", name: "Haemul Pajeon", description: "Seafood and scallion pancake.", price: 22 },
            ],
          },
          {
            id: "chicken",
            name: "Fried Chicken",
            description: "Double-fried. Half or whole.",
            items: [
              {
                id: "yangnyeom",
                name: "Yangnyeom",
                description: "Sweet-spicy glaze, crushed peanuts.",
                price: 24,
                tags: ["spicy", "nuts"],
                variants: [
                  { label: "Half", price: 24 },
                  { label: "Whole", price: 40 },
                ],
              },
              {
                id: "soy-garlic",
                name: "Soy Garlic",
                price: 24,
                variants: [
                  { label: "Half", price: 24 },
                  { label: "Whole", price: 40 },
                ],
              },
            ],
          },
          {
            id: "drinks",
            name: "Soju & Beer",
            items: [
              { id: "soju", name: "Soju", description: "Original, grapefruit, or peach.", price: 16 },
              { id: "somaek", name: "Somaek Tower", description: "Soju, lager, and a lot of fun.", price: 38 },
              { id: "cass", name: "Cass Lager", price: 8 },
            ],
          },
        ],
      },
    ],
    stats: stats("seoul-smoke", 24),
  },

  {
    slug: "dosa-republic",
    name: "Dosa Republic",
    tagline: "South Indian dosas, idli, and filter coffee.",
    cuisine: ["Indian", "South Indian"],
    priceLevel: 2,
    neighborhood: NEIGHBORHOOD,
    address: "3199 Mission St, San Francisco, CA 94110",
    phone: "+14155550155",
    timezone: TZ,
    accent: "#C47F0E",
    cover: "1585937421612-70a008356fbe",
    hours: schedule([["11:30", "14:30"], ["17:30", "21:30"]], { closed: [1] }),
    links: [
      { kind: "order", label: "Order delivery", url: "https://example.com/order" },
      { kind: "website", label: "Website", url: "https://example.com" },
    ],
    claimed: false,
    source: "visit",
    verifiedAt: "2026-09-14",
    googleMenuLink: false,
    menus: [
      {
        id: "menu",
        name: "Menu",
        sections: [
          {
            id: "dosa",
            name: "Dosa",
            description: "Fermented rice and lentil crêpes with sambar and three chutneys.",
            items: [
              { id: "masala-dosa", name: "Masala Dosa", description: "Spiced potato and onion filling.", price: 15, popular: true, tags: ["vegan", "gluten-free"] },
              { id: "mysore-masala", name: "Mysore Masala Dosa", description: "Red chili-garlic chutney spread inside.", price: 16, tags: ["vegan", "gluten-free", "spicy"], popular: true },
              { id: "ghee-roast", name: "Ghee Roast Dosa", description: "Paper thin, crisp, a metre of it.", price: 16, tags: ["vegetarian", "gluten-free"] },
              { id: "paneer-dosa", name: "Chili Paneer Dosa", description: "Indo-Chinese paneer, peppers, scallion.", price: 18, tags: ["vegetarian", "spicy"] },
              { id: "rava-dosa", name: "Onion Rava Dosa", description: "Lacy semolina crêpe, cumin, green chili.", price: 16, tags: ["vegan"] },
            ],
          },
          {
            id: "tiffin",
            name: "Tiffin",
            items: [
              { id: "idli", name: "Idli (3)", description: "Steamed rice cakes, sambar, chutney.", price: 10, tags: ["vegan", "gluten-free"] },
              { id: "medu-vada", name: "Medu Vada (3)", description: "Crisp lentil doughnuts.", price: 10, tags: ["vegan", "gluten-free"] },
              { id: "samosa", name: "Samosa Chaat", description: "Crushed samosa, chickpeas, yogurt, tamarind.", price: 12, image: "1601050690597-df0568f70950", tags: ["vegetarian"] },
            ],
          },
          {
            id: "curries",
            name: "Curries",
            description: "With basmati rice or two parottas.",
            items: [
              { id: "chettinad", name: "Chicken Chettinad", description: "Black pepper, fennel, curry leaf.", price: 21, image: "1565557623262-b51c2513a641", tags: ["spicy", "gluten-free"] },
              { id: "kerala-fish", name: "Kerala Fish Curry", description: "Coconut, kokum, green chili.", price: 23, tags: ["gluten-free"] },
              { id: "avial", name: "Avial", description: "Mixed vegetables, coconut, yogurt.", price: 17, tags: ["vegetarian", "gluten-free"] },
            ],
          },
          {
            id: "drinks",
            name: "Drinks",
            items: [
              { id: "filter-coffee", name: "Madras Filter Coffee", price: 4.5, popular: true },
              { id: "mango-lassi", name: "Mango Lassi", price: 6, tags: ["vegetarian", "gluten-free"] },
              { id: "masala-chai", name: "Masala Chai", price: 4 },
            ],
          },
        ],
      },
    ],
    stats: stats("dosa-republic", 30),
  },
];

