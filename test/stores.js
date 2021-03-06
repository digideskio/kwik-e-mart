
var Boutique = require('../src/index')

describe('Stores', ()=> {
  var btq;

  beforeEach(()=> {
    btq = new Boutique()
  })

  it('should Mixin in store methods', () => {
    var store = btq.createStore({ hi: 'hi'})

    Object.getPrototypeOf(store).should.contain.keys([
      'bindAction',
      'bindActions',
      'setState', 
      'emitChange', 
      'listen', 
      'stopListening', 
      'waitFor'
    ])
  })


  it('should listen for an action', done => {
     let actions = btq.createActions(
          btq.generateActions(['login', 'logout']));

    class Store {
      constructor(){
        this.bindAction(actions.login, 'onLogin')
      }

      onLogin(arg){
        arg.should.equal('hi')
        done()
      }
    }

    btq.createStore(Store);

    actions.logout()
    actions.login('hi')
  })

  it('should listen for multiple actions', done => {
    let actions = btq.createActions(
          btq.generateActions(['login', 'logout']));

    let count = 0;

    class Store {
      constructor(){
        this.bindActions(actions)
      }

      onLogin(arg){
        arg.should.equal('hi')
        count++;
      }

      onLogout(){
        count && done()
      }
    }

    btq.createStore(Store);

    actions.login('hi')
    actions.logout()
  })

  it('should bind listener hash', done => {
    let actions = btq.createActions(
          btq.generateActions(['login', 'logout']));

    let count = 0;

    class Store {
      constructor(){
        this.bindListeners({
          onSuccess: [ 
            actions.login.success, 
            actions.logout.success
          ],
          onLogin: actions.login
        })
      }

      onSuccess(){ count++; }

      onLogin(){
        (count == 2) && done() 
      }
    }

    btq.createStore(Store);

    actions.login.success()
    actions.logout.success()

    actions.login()
  })

  it('should listen for async completion actions when they exist', done => {
    let actions = btq.createActions(
          btq.generateActions(['login', 'logout']));

    let count = 0;

    class Store {
      constructor(){
        this.bindActions(actions)
      }

      onLogin(arg){ count++ }
      onLoginSuccess(arg){ count++ }

      onLogout(){
        (count == 2) && done()
      }
    }

    btq.createStore(Store);

    actions.login()
    actions.login.success()

    actions.logout()
  })

  it('should be observable', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, 'onLogin')
      }

      onLogin() {
        this.emitChange()
      }
    }

    let store = btq.createStore(Store)
      , spy = sinon.spy();

    store.listen(spy)

    actions.login()
    store.stopListening(spy)

    actions.login()

    spy.should.have.been.calledOnce;
  })

  it('should update state', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, 'onLogin')

        this.state = { first: 5}
      }

      onLogin() {
        this.setState({ prop: 1 })
        this.setState({ otherProp: 3 })
      }
    }

    let store = btq.createStore(Store);

    actions.login()

    store.state.should.eql({ first: 5, prop: 1, otherProp: 3})
  })

  it('should be batchable', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    let spy = sinon.spy()
      , store = btq.createStore({

        login() {
          this.batchChanges(()=> {
            this.setState({ prop: 1 })
            this.setState({ otherProp: 3 })
          })
        }
      });

    store.listen(spy)
    store.login()

    spy.should.have.been.calledOnce;
  })

  it('should batch dispatches', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    let spy = sinon.spy()
      , store = btq.createStore({
        constructor(){
          this.bindAction(actions.login, 'onLogin')
        },

        onLogin() {
          this.setState({ prop: 1 })
          this.setState({ otherProp: 3 })
        }
      });

    store.listen(spy)

    actions.login()

    spy.should.have.been.calledOnce;
  })

  it('should not emit change when no setState calls were made', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    let spy = sinon.spy()
      , store = btq.createStore({
          constructor(){
            this.bindAction(actions.login, 'onLogin')
          },

          onLogin() {}
        });

    store.listen(spy)

    actions.login()

    spy.should.not.have.been.called;
  })

  it('should be update state synchronously', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, 'onLogin')
      }

      onLogin() {
        this.setState({ prop: 1 })
        this.state.should.eql({ prop: 1 })

        this.setState({ otherProp: 3 })
        this.state.should.eql({ prop: 1, otherProp: 3})
      }
    }

    let store = btq.createStore(Store)
      , spy = sinon.spy();

    store.listen(spy)

    actions.login()
    
    spy.should.have.been.calledOnce;
  })

  it('should not break store prototype chain', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class BaseStore {
      onLogout(){}
    }

    class Store extends BaseStore {
      constructor(){
        super()
        this.bindAction(actions.login)
      }

      onLogin() {}
    }

    btq.createStore(Store)
      .onLogout.should.be.a('function');
  })

  it('should warn on direct action handler access', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, 'onLogin')
      }

      onLogin() {}
    }

    let store = btq.createStore(Store)
      , spy = sinon.stub(console, 'warn');

    store.onLogin()

    spy.should.have.been.calledOnce;

    console.warn.restore()
  })

  it.only('should warn on bad handler method name', done => {
    let actions = btq.createActions(btq.generateActions(['login']))
      , spy = sinon.stub(console, 'warn');

    class Store {
      constructor(){
        this.bindAction(actions.login)
      }

      login() {
        done()
      }
    }

    btq.createStore(Store)
    actions.login()
    spy.should.have.been.calledOnce
    console.warn.restore()
  })
})