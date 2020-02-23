import React from 'react';
import { NavLink } from 'react-router-dom';
import './menu.css';

class Menu extends React.Component {
	render() {
		return (
			<div id="menu">
				<MenuCategory name="New">
					<NavLink to="/verification/paymentAdd">
						Payment
					</NavLink>

				</MenuCategory>
				<MenuCategory name="Info">
					<NavLink to="/verifications">
						Verifications
					</NavLink>
				</MenuCategory>
				<MenuCategory name="Helpers">
				</MenuCategory>
			</div>
		);
	}
}

class MenuCategory extends React.Component {
	render() {
		return (
			<div className="category">
				<div className="name">
					{this.props.name}
				</div>
				{this.props.children}
			</div>
		);
	}
}

export default Menu;