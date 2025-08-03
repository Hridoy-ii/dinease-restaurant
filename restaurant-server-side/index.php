<?php
// --------------------------------------
// PHP start from here
// Bistro Boss Server Side Code (PHP Version)
// --------------------------------------

// For Composer dependencies (MongoDB, Stripe, dotenv, etc.)
require 'vendor/autoload.php';

use MongoDB\Client as MongoClient;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Dotenv\Dotenv;
use MongoDB\BSON\ObjectId;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
try {
    $dotenv->load();
} catch (Exception $e) {
    die('Could not load environment variables: ' . $e->getMessage());
}

// Handle CORS headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight (OPTIONS) request - FIXED: Only one OPTIONS handler needed
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
    http_response_code(200);
    exit();
}

// MongoDB connection
$mongoUri = "mongodb+srv://{$_ENV['DB_USER']}:{$_ENV['DB_PASS']}@cluster0.qwzhyfr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
$client = new MongoClient($mongoUri);
$db = $client->bistroDB;

// Stripe setup
\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

// Helper: send JSON response
function send_json($data, $status = 200) {
    // Always set CORS headers first
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
    header('Content-Type: application/json');
    
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Helper: get request body
function get_body() {
  return json_decode(file_get_contents('php://input'), true);
}

// JWT verification middleware
function verify_token() {
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    if (!isset($headers['authorization'])) {
      send_json(['message' => 'unauthorized access'], 401);
    }
  
    $parts = explode(' ', $headers['authorization']);
    if (count($parts) !== 2 || strtolower($parts[0]) !== 'bearer') {
      send_json(['message' => 'invalid authorization header'], 401);
    }
  
    $token = $parts[1];
  
    try {
      $decoded = JWT::decode($token, new Key($_ENV['ACCESS_TOKEN_SECRET'], 'HS256'));
      return (array)$decoded;
    } catch (Exception $e) {
      send_json(['message' => 'unauthorized access'], 401);
    }
  }
  

// Admin verification middleware
function verify_admin($email, $db) {
  $user = $db->user->findOne(['email' => $email]);
  if (!$user || ($user['role'] ?? '') !== 'admin') {
    send_json(['message' => 'forbidden access'], 403);
  }
}

// Routing
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// JWT token creation
if ($method === 'POST' && $path === '/jwt') {
  $user = get_body();
  $token = JWT::encode($user, $_ENV['ACCESS_TOKEN_SECRET'], 'HS256');
  send_json(['token' => $token]);
}

// Users endpoints
if ($method === 'GET' && $path === '/users') {
  $decoded = verify_token();
  verify_admin($decoded['email'], $db);
  $users = iterator_to_array($db->user->find());
  send_json($users);
}

if ($method === 'GET' && preg_match('#^/users/admin/(.+)$#', $path, $m)) {
  $decoded = verify_token();
  $email = urldecode($m[1]);
  if ($email !== $decoded['email']) send_json(['message' => 'forbidden access'], 403);
  $user = $db->user->findOne(['email' => $email]);
  $admin = ($user && ($user['role'] ?? '') === 'admin');
  send_json(['admin' => $admin]);
}

if ($method === 'POST' && $path === '/users') {
  $user = get_body();
  $existing = $db->user->findOne(['email' => $user['email']]);
  if ($existing) send_json(['message' => 'user already exist']);
  $result = $db->user->insertOne($user);
  send_json($result->getInsertedId());
}

if ($method === 'PATCH' && preg_match('#^/users/admin/([a-f\d]{24})$#', $path, $m)) {
  $decoded = verify_token();
  verify_admin($decoded['email'], $db);
  $id = $m[1];
  $result = $db->user->updateOne(['_id' => new ObjectId($id)], ['$set' => ['role' => 'admin']]);
  send_json($result->getModifiedCount());
}

if ($method === 'DELETE' && preg_match('#^/users/([a-f\d]{24})$#', $path, $m)) {
  $decoded = verify_token();
  verify_admin($decoded['email'], $db);
  $id = $m[1];
  $result = $db->user->deleteOne(['_id' => new MongoDB\BSON\ObjectId($id)]);
  send_json($result->getDeletedCount());
}

// Menu endpoints
if ($method === 'GET' && $path === '/menu') {
  $menu = iterator_to_array($db->menu->find());
  send_json($menu);
}

if ($method === 'GET' && preg_match('#^/menu/([a-f\d]{24})$#', $path, $m)) {
  $id = $m[1];
  $item = $db->menu->findOne(['_id' => new MongoDB\BSON\ObjectId($id)]);
  send_json($item);
}

if ($method === 'POST' && $path === '/menu') {
  $decoded = verify_token();
  verify_admin($decoded['email'], $db);
  $item = get_body();
  $result = $db->menu->insertOne($item);
  send_json($result->getInsertedId());
}

if ($method === 'PATCH' && preg_match('#^/menu/([a-f\d]{24})$#', $path, $m)) {
  $id = $m[1];
  $item = get_body();
  $update = ['$set' => [
    'name' => $item['name'],
    'category' => $item['category'],
    'price' => $item['price'],
    'recipe' => $item['recipe'],
    'image' => $item['image']
  ]];
  $result = $db->menu->updateOne(['_id' => new MongoDB\BSON\ObjectId($id)], $update);
  send_json($result->getModifiedCount());
}

if ($method === 'DELETE' && preg_match('#^/menu/([a-f\d]{24})$#', $path, $m)) {
  $decoded = verify_token();
  verify_admin($decoded['email'], $db);
  $id = $m[1];
  $result = $db->menu->deleteOne(['_id' => new MongoDB\BSON\ObjectId($id)]);
  send_json($result->getDeletedCount());
}

// Reviews endpoint
if ($method === 'GET' && $path === '/reviews') {
  $reviews = iterator_to_array($db->reviews->find());
  send_json($reviews);
}

// Carts endpoints
if ($method === 'GET' && $path === '/carts') {
  $email = $_GET['email'] ?? '';
  $carts = iterator_to_array($db->carts->find(['email' => $email]));
  send_json($carts);
}

if ($method === 'POST' && $path === '/carts') {
  $cartItem = get_body();
  $result = $db->carts->insertOne($cartItem);
  send_json($result->getInsertedId());
}

if ($method === 'DELETE' && preg_match('#^/carts/([a-f\d]{24})$#', $path, $m)) {
  $id = $m[1];
  $result = $db->carts->deleteOne(['_id' => new MongoDB\BSON\ObjectId($id)]);
  send_json($result->getDeletedCount());
}

// Stripe payment intent
if ($method === 'POST' && $path === '/create-payment-intent') {
  $body = get_body();
  $price = $body['price'] ?? 0;
  if (!$price || $price <= 0) send_json(['error' => 'Invalid price'], 400);
  $amount = intval($price * 100);
  $intent = \Stripe\PaymentIntent::create([
    'amount' => $amount,
    'currency' => 'usd',
    'payment_method_types' => ['card']
  ]);
  send_json(['clientSecret' => $intent->client_secret]);
}

// Payment history
if ($method === 'GET' && preg_match('#^/payments/(.+)$#', $path, $m)) {
  $decoded = verify_token();
  $email = urldecode($m[1]);
  if ($email !== $decoded['email']) send_json(['message' => 'Forbidden Access'], 403);
  $payments = iterator_to_array($db->payments->find(['email' => $email]));
  send_json($payments);
}

// Payments endpoint
if ($method === 'POST' && $path === '/payments') {
  $payment = get_body();
  $paymentResult = $db->payments->insertOne($payment);

  // Delete cart items
  $cartIds = array_map(function($id) { return new MongoDB\BSON\ObjectId($id); }, $payment['cartIds']);
  $deleteResult = $db->carts->deleteMany(['_id' => ['$in' => $cartIds]]);

  // Send email (Mailgun)
  $mg = Mailgun\Mailgun::create($_ENV['MAILGUN_API_KEY']);
  $mg->messages()->send($_ENV['MAILGUN_DOMAIN'], [
    'from'    => "Excited User <mailgun@{$_ENV['MAILGUN_DOMAIN']}>",
    'to'      => $payment['email'],
    'subject' => "Mailgun test",
    'text'    => "Testing some Mailgun awesomness and it says your order is confirm!",
    'html'    => "<h1>Testing some Mailgun awesomness!</h1>
            <h2>Order ID: <strong>{$payment['transactionId']}</strong></h2>
            <p>Thank you for your order!</p>
            <p>We appreciate your business and hope you enjoy your purchase.</p>
            <p>If you have any questions or concerns, please don't hesitate to reach out to us.</p>
            <p>Best regards,</p>
            <p>Bistro Boss</p>"
  ]);

  send_json(['paymentResult' => $paymentResult->getInsertedId(), 'deleteResult' => $deleteResult->getDeletedCount()]);
}

// Admin dashboard status
if ($method === 'GET' && $path === '/admin-status') {
  $decoded = verify_token();
  verify_admin($decoded['email'], $db);
  $users = $db->user->countDocuments();
  $menuItems = $db->menu->countDocuments();
  $orders = $db->payments->countDocuments();
  $agg = $db->payments->aggregate([
    ['$group' => ['_id' => null, 'totalRevenue' => ['$sum' => '$price']]]
  ]);
  $result = iterator_to_array($agg);
  $revenue = $result[0]['totalRevenue'] ?? 0;
  send_json([
    'users' => $users,
    'menuItems' => $menuItems,
    'orders' => $orders,
    'revenue' => $revenue
  ]);
}

// Order stats
if ($method === 'GET' && $path === '/order-stats') {
  $decoded = verify_token();
  verify_admin($decoded['email'], $db);
  $pipeline = [
    ['$unwind' => '$menuItemIds'],
    ['$lookup' => [
      'from' => 'menu',
      'localField' => 'menuItemIds',
      'foreignField' => '_id',
      'as' => 'menuItems'
    ]],
    ['$unwind' => '$menuItems'],
    ['$group' => [
      '_id' => '$menuItems.category',
      'quantity' => ['$sum' => 1],
      'revenue' => ['$sum' => '$menuItems.price']
    ]],
    ['$project' => [
      '_id' => 0,
      'category' => '$_id',
      'quantity' => '$quantity',
      'revenue' => '$revenue'
    ]]
  ];
  $result = iterator_to_array($db->payments->aggregate($pipeline));
  send_json($result);
}

// Root endpoint
if ($method === 'GET' && $path === '/') {
  send_json(['message' => 'boss is sitting']);
}

// Fallback
send_json(['error' => 'Not Found'], 404);
?>