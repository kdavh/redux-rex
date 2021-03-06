import {mount} from 'enzyme';

import {combineReducers, createStore, applyMiddleware, compose} from 'redux';
import thunkMiddleware from 'redux-thunk';
import * as React from 'react';
import {connect, Provider} from 'react-redux';
import {Route, BrowserRouter} from 'react-router-dom';
import {routerReducer} from 'react-router-redux';

import {actionReducer, asyncRequest, YarbrModule, thunkCreator} from '../src/ts/index';

const initialState = {
	counter: 0,
	myData: {
		data: null,
	},
};

class CounterModule extends YarbrModule {
	public get namespace() {
		return 'counter';
	}

	@actionReducer
	public updateCounter(state, action) {
		return {
			...state,
			counter: state.counter + action.payload,
		};
	}

	@thunkCreator
	public updateCounterThunk(amount) {
		return (dispatch /*getState*/) => dispatch(this.actionCreators.updateCounter(amount));
	}

	@asyncRequest
	public myData(arg1, arg2) {
		return Promise.resolve(`amazing data with args: ${arg1} ${arg2}`);
	}
}
const module1 = new CounterModule(initialState);

// example components
const CounterComponent = ({counter, myData, myDataRequest, updateCounter, updateCounterThunk }) => (
	<div>
		<h1>Count: {counter}</h1>
		<button id="buttonUpdate" onClick={() => updateCounter(1)}>+</button>
		<button id="buttonThunk" onClick={() => updateCounterThunk(1)}>...+</button>
		<div>Data: {myData.data}</div>
		<button id="buttonDataRequest" onClick={() => myDataRequest('foo', 'bar')}>...++</button>
	</div>
);

const CounterContainer = connect(
	(state) => {
		const {counter, myData} = state[module1.namespace];
		return {counter, myData};
	},
	{
		myDataRequest: module1.thunkCreators.myDataRequest,
		updateCounter: module1.actionCreators.updateCounter,
		updateCounterThunk: module1.thunkCreators.updateCounterThunk,
	},
)(CounterComponent);

const appReducer = combineReducers({
	[module1.namespace]: module1.reducer,
	routing: routerReducer,
});

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const appStore = createStore(appReducer, undefined, composeEnhancers(
	applyMiddleware(
		thunkMiddleware,
	),
));

const App = (
	<Provider store={appStore}>
		<BrowserRouter>
			<Route path="/" component={CounterContainer}/>
		</BrowserRouter>
	</Provider>
);

describe('YarbrModule app integration', () => {
	it('should render a working app', () => {
		const app = mount(App);

		expect(app.find('h1').text()).toContain('Count: 0');
		expect(app.text()).not.toContain('amazing data');
		app.find('#buttonUpdate').simulate('click');
		expect(app.find('h1').text()).toContain('Count: 1');
		app.find('#buttonDataRequest').simulate('click');

		process.nextTick
		return new Promise((resolve) => {
			// wait for next round of promise processing before expectation
			resolve();
		}).then(() => {
			expect(app.text()).toContain('amazing data with args: foo bar');
		});
	});
});
