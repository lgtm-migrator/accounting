<?php namespace Config;

// Create a new instance of our RouteCollection class.
$routes = Services::routes(true);

// Load the system's routing file first, so that the app and ENVIRONMENT
// can override as needed.
if (file_exists(SYSTEMPATH . 'Config/Routes.php'))
{
	require SYSTEMPATH . 'Config/Routes.php';
}

/**
 * --------------------------------------------------------------------
 * Router Setup
 * --------------------------------------------------------------------
 */
$routes->setDefaultNamespace('App\Controllers');
$routes->setDefaultController('Home');
$routes->setDefaultMethod('index');
$routes->setTranslateURIDashes(false);
$routes->set404Override();
$routes->setAutoRoute(true);

/**
 * --------------------------------------------------------------------
 * Route Definitions
 * --------------------------------------------------------------------
 */

// We get a performance increase by specifying the default
// route since we don't have to scan directories.
$routes->get('/', 'Home::index');
$routes->options('(:any)', 'ApiController::allowCorbs');

// User
$routes->post('user/login', 'User::login');

// Verification
$routes->get('verifications', 'Verification::getAll');
$routes->post('verification/create-payment', 'Verification::createPayment');
$routes->post('verification/create-transaction', 'Verification::createTransaction');
$routes->post('verification/create-from-pdf', 'Verification::createFromPdf');
$routes->get('verifications/bind', 'Verification::bind');

// Account
$routes->get('accounts', 'Account::getAll');
$routes->get('account/get-vat-info', 'Account::getVatInfo');
$routes->post('account/fill', 'Account::fill');

// SIE
$routes->get('sie/old', 'Sie::old');
$routes->get('sie', 'Sie::export');
$routes->get('ledger', 'Sie::ledger');

/**
 * --------------------------------------------------------------------
 * Additional Routing
 * --------------------------------------------------------------------
 *
 * There will often be times that you need additional routing and you
 * need to it be able to override any defaults in this file. Environment
 * based routes is one such time. require() additional route files here
 * to make that happen.
 *
 * You will have access to the $routes object within that file without
 * needing to reload it.
 */
if (file_exists(APPPATH . 'Config/' . ENVIRONMENT . '/Routes.php'))
{
	require APPPATH . 'Config/' . ENVIRONMENT . '/Routes.php';
}
