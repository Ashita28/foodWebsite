require('dotenv').config();
const mongoose = require('mongoose');
const Food = require('./models/Food');

const MONGO_URI = process.env.MONGO_URI;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, d = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(d));

const drinkImages = [
  'https://rosepng.com/wp-content/uploads/2024/08/s11728_cold_drink_isolated_on_white_background_5b4036d2-3048-4463-9b77-21d8e91313d0_2-photoroom.png',
  'https://i.pinimg.com/736x/d1/6b/7a/d16b7a2553252183b8f49aaa2336fca0.jpg',
  'https://www.vhv.rs/dpng/d/458-4589809_beverage-png-image-hd-transparent-png-cup-juice.png',
  'https://static.vecteezy.com/system/resources/thumbnails/045/933/094/small/summertime-treat-mango-juice-and-slices-for-your-creative-projects-free-png.png',
  'https://rosepng.com/wp-content/uploads/2025/01/real-fruit-juice-1.png',
  'https://thumbs.dreamstime.com/b/vibrant-image-showcasing-refreshing-concept-pineapple-juice-splash-juice-erupts-pineapple-base-creating-397125512.jpg',
];

const friesImages = [
  'https://png.pngtree.com/png-clipart/20250429/original/pngtree-hot-and-crispy-french-fries-in-red-box-png-image_20891964.png',
  'https://static.vecteezy.com/system/resources/thumbnails/036/290/866/small/ai-generated-french-fries-with-dipping-sauce-on-a-transparent-background-ai-png.png',
  'https://png.pngtree.com/png-vector/20240130/ourmid/pngtree-french-fried-chips-isolated-png-png-image_11572782.png',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjuBKAsJzrHg87vcTrmzF5EOXneW0hXT4rmg&s',
  'https://img.freepik.com/free-photo/french-fries_1339-1403.jpg?semt=ais_hybrid&w=740&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE6MAOg2Z5mSqD7-4XV14uCFl79IPNfD9Tlw&s',
];

const saladImages = [
  'https://png.pngtree.com/png-vector/20240712/ourmid/pngtree-food-bowl-vegetable-salad-png-image_13052209.png',
  'https://www.freeiconspng.com/uploads/salad-png-transparent-images-11.png',
  'https://www.freeiconspng.com/uploads/greek-salad-png-21.png',
];

const burgerImages = [
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJfil_12iDPKI6VUiqFqLBG8FpVdN_PzpAnA&s',
  'https://i.pinimg.com/736x/95/aa/34/95aa34722ae9ea7e8faa874e5d24ebab.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1dCqxnJjbe88fKwPDMimCCW-9_mjf3sz7Aw&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5dSyH3TJaYa9al39vS435tKK50mLZ-by3Kg&s',
  'https://blog.swiggy.com/wp-content/uploads/2025/01/Image-1_-cheese-burger-1024x538.png',
  'https://blog.swiggy.com/wp-content/uploads/2025/01/Image-6_-smash-burger-1024x538.png',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKi6FGIo9UTXF-MDDJeX0Eblc-MBjghKaHbA&s',
  'https://freepngimg.com/download/burger_sandwich/12-hamburger-burger-png-image.png',
  'https://www.shutterstock.com/image-photo/bacon-burger-isolation-on-transparent-600nw-2628364027.jpg',
  'https://blog.swiggy.com/wp-content/uploads/2025/01/Image-2_-veggie-burger-1024x538.png',
  'https://plus.unsplash.com/premium_photo-1683619761492-639240d29bb5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YnVyZ2VyJTIwcG5nfGVufDB8fDB8fHww&fm=jpg&q=60&w=3000',
  'https://png.pngtree.com/png-clipart/20231121/original/pngtree-burgers-png-image_13675904.png',
  'https://pngimg.com/d/burger_sandwich_PNG4133.png',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2D3CUHtz4cxHVIDezy7uRuFVm3uuyHVQR4w&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5A7Ba1lEc02wtgGVWHtkD0aYIvWwvhmIRjQ&s',
  'https://raw.githubusercontent.com/hdpngworld/HPW/main/uploads/6528f9ac2dd11-Classic%20veg%20burger%20hd%20png.png',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEZ1QNTRePuW07v0ZWuS5fFIzbBMpRZYU9Uw&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7mQB2jh98s4Oji4-uCiavYAapqmamji1XUA&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6_Ho5cInTaIcCILn7J7q6IgweuTawAgKxBA&s',
  'https://raw.githubusercontent.com/hdpngworld/HPW/main/uploads/652a78b5108c3-CHICKEN%20CHEESE%20BURGER.png',
  'https://i.pinimg.com/736x/fe/39/7f/fe397f15072fb0dce720148bc7b9808e.jpg',
  'https://thumbs.dreamstime.com/b/closeup-studio-shot-two-delicious-gourmet-burgers-stacked-rustic-wooden-cutting-board-burgers-feature-sesame-seed-buns-379412349.jpg',
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnVyZ2VyJTIwcG5nfGVufDB8fDB8fHww&fm=jpg&q=60&w=3000',
  'https://simg.nicepng.com/png/small/250-2509044_beef-burger.png',
];

const sandwichImages = [
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiRJdt3QqJut1q1TxezzkB4B04mr0r3avxoA&s',
  'https://www.pngplay.com/wp-content/uploads/1/Subway-Sandwich-Transparent-Background.png',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYjjH5bUHIK9MC-wyJoVn8_e9LbD3JNppo9g&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvctmNvWBiekaKBmU8N1LmGUy3dm2KVNz2wg&s',
];

const dessertImages = [
  'https://img.freepik.com/free-psd/delicious-chocolate-dessert-with-strawberries_632498-24458.jpg?semt=ais_hybrid&w=740&q=80',
  'https://i.pinimg.com/736x/c8/14/0f/c8140f7a52a1dbba12384748d853a235.jpg',
  'https://img.freepik.com/free-photo/high-angle-dessert-with-bananas-cherries_23-2150764224.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJB0hNxulSWo9flbPypHOi5VqoFHy5_qD5Hw&s',
];

const burgerNames = [
  'Classic Cheeseburger',
  'BBQ Bacon Burger',
  'Veggie Delight Burger',
  'Smash Double Patty',
  'Cheese Overload Burger',
  'Spicy Chicken Burger',
  'Smoky Lamb Burger',
  'Crispy Paneer Burger',
  'Bacon Lover’s Burger',
  'Garden Veg Burger',
  'Mushroom Swiss Burger',
  'Peri Peri Chicken Burger',
  'Tandoori Paneer Burger',
  'Jalapeño Popper Burger',
  'Aloo Tikki Street Burger',
  'Truffle Melt Burger',
  'Chipotle Black Bean Burger',
  'Mediterranean Falafel Burger',
  'Butter Chicken Burger',
  'Korean Bulgogi Burger',
  'Nashville Hot Chicken Burger',
  'Teriyaki Pineapple Burger',
  'Pepper Jack Ranch Burger',
  'Ultimate House Burger',
];

const drinkNames = [
  'Mango Cooler',
  'Berry Fizz',
  'Classic Lemonade',
  'Tropical Punch',
  'Real Fruit Juice',
  'Pineapple Splash',
];

const friesNames = [
  'Classic Salted Fries',
  'Peri Peri Fries',
  'Herb Seasoned Fries',
  'Spicy Masala Fries',
  'Cajun Crinkle Fries',
  'Cheesy Loaded Fries',
];

const saladNames = [
  'Garden Green Salad',
  'Classic Veg Salad',
  'Greek Feta Salad',
];

const sandwichNames = [
  'Grilled Veg Sandwich',
  'Subway Style Club',
  'Cheese Corn Sandwich',
  'Tandoori Paneer Sub',
];

const dessertNames = [
  'Chocolate Strawberry Delight',
  'Berry Cheesecake Slice',
  'Banana Split Sundae',
  'Cherry Mousse Cup',
];

const burgersCount = Math.min(burgerImages.length, burgerNames.length);
const burgerFoods = Array.from({ length: burgersCount }, (_, i) => ({
  itemImage: burgerImages[i],
  name: burgerNames[i],
  description: 'Signature burger with fresh ingredients and house sauce.',
  price: randInt(169, 329),
  avgPrepTime: randInt(12, 20),
  category: 'burger',
  stock: true,
  rating: randFloat(4.0, 5.0),
}));

const drinkFoods = drinkImages.map((url, i) => ({
  itemImage: url,
  name: drinkNames[i],
  description: 'Refreshing beverage served cold.',
  price: randInt(69, 149),
  avgPrepTime: randInt(1, 3),
  category: 'drinks',
  stock: true,
  rating: randFloat(4.0, 5.0),
}));

const friesFoods = friesImages.map((url, i) => ({
  itemImage: url,
  name: friesNames[i],
  description: 'Golden fries with a crispy crunch.',
  price: randInt(79, 199),
  avgPrepTime: randInt(7, 12),
  category: 'fries',
  stock: true,
  rating: randFloat(4.0, 5.0),
}));

const saladFoods = saladImages.map((url, i) => ({
  itemImage: url,
  name: saladNames[i],
  description: 'Light and healthy salad bowl.',
  price: randInt(99, 229),
  avgPrepTime: randInt(4, 7),
  category: 'salads',
  stock: true,
  rating: randFloat(4.0, 5.0),
}));

const sandwichesFoods = sandwichImages.map((url, i) => ({
  itemImage: url,
  name: sandwichNames[i],
  description: 'Freshly made sandwich with crunchy veggies and sauce.',
  price: randInt(119, 249),
  avgPrepTime: randInt(6, 10),
  category: 'sandwiches',
  stock: true,
  rating: randFloat(4.0, 5.0),
}));

const dessertsFoods = dessertImages.map((url, i) => ({
  itemImage: url,
  name: dessertNames[i],
  description: 'Sweet dessert crafted to satisfy cravings.',
  price: randInt(129, 279),
  avgPrepTime: randInt(3, 6),
  category: 'desserts',
  stock: true,
  rating: randFloat(4.0, 5.0),
}));

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const ops = [
      { cat: 'burger', data: burgerFoods },
      { cat: 'drinks', data: drinkFoods },
      { cat: 'fries', data: friesFoods },
      { cat: 'salads', data: saladFoods },
      { cat: 'sandwiches', data: sandwichesFoods },
      { cat: 'desserts', data: dessertsFoods },
    ];
    for (const { cat, data } of ops) {
      await Food.deleteMany({ category: cat });
      await Food.insertMany(data);
    }
    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
})();
