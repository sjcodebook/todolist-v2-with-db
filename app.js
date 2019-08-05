//jshint esversion:6

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(express.static('public'));

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true });

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('list', listSchema);

const Item = mongoose.model('item', itemsSchema);

const item1 = new Item({
  name: 'welcome to todolist!'
});

const item2 = new Item({
  name: 'hit + to add item'
});

const item3 = new Item({
  name: '<--- hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

app.get('/', function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('successfully inserted');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', {
        listTitle: 'Today',
        newListItems: foundItems
      });
    }
  });
});

app.post('/', function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post('/delete', function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log('successfully deleted the item');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function(err) {
        if (!err) {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

app.get('/:customList', function(req, res) {
  const customListName = _.capitalize(req.params.customList);

  List.findOne({ name: customListName }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        //show an existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.get('/about', function(req, res) {
  res.render('about');
});

let port = process.env.PORT;
if (port == null || port == '') {
  port = 5000;
}

app.listen(port, function() {
  console.log('Server started');
});
