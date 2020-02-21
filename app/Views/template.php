<!DOCTYPE html>
<html>
<head>
<title>Accounting</title>
</head>
<body>
	<h1>This is the header</h1>

	<div id="content"></div>

<script src="https://unpkg.com/react@16/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js" crossorigin></script>

<!-- Development -->
<script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>

<!-- Load the right view -->
<script type="text/babel" src="<?= base_url("test.jsx") ?>"/>

</body>
</html>
