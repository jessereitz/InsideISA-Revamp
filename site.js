////////////////////////////////////
/////     STYLE CONSTANTS     //////
////////////////////////////////////
const TD_CTN_STYLE = "border-bottom: 3px solid #ddd;";
const CONTENT_HEADING_CTN_STYLE = "margin: 20px; width: 80%;";
const CONTENT_TYPE_STYLE = "font-family: 'Helvetica', sans-serif; font-weight: normal; font-size: 16px; margin: 0; color: #888;";
const CONTENT_TITLE_STYLE = "font-family: 'Helvetica', sans-serif; font-weight: normal; font-size: 24px; margin: 0; margin-top: 5px; color: #333;";
const CONTENT_IMG_STYLE = "max-width: 100%;  text-align: center; margin-left: auto; margin-right: auto;";
const CONTENT_BLURB_STYLE = "margin:0;padding-top:7px;padding-bottom:7px;padding: 20px;";
const CONTENT_LINK_CTN_STYLE = "margin:0;padding-top:7px;padding-bottom:7px;;padding-left: 20px; padding-bottom: 20px; color: blue;";
const CONTENT_LINK_STYLE = "color: inherit; text-decoration: none;";

//////////////////////////////////////
/////     TEXT PLACEHOLDERS     //////
//////////////////////////////////////
const PLACEHOLDER_TYPE = "Content Type";
const PLACEHOLDER_TITLE = "Content Title";
const PLACEHOLDER_IMG = './images/placeholder.gif';
const PLACEHOLDER_BLURB = "This is the blurb";
const PLACEHOLDER_LINK = "Learn More";

// FIELDS
const CONTENT_IMG_FIELDS = ['URL', 'Title', 'Alt Text'];
const CONTENT_LINK_FIELDS = ['URL', 'Text'];


/////////////////////////////
/////     UTILITIES     /////
/////////////////////////////
function generateElement(tagName, klasses, id) {
  if (!tagName) {
    return False;
  }
  var el = document.createElement(tagName);
  if (id) {
    el.setAttribute('id', id);
  }
  if (klasses) {
    for (let klass of klasses) {
      el.classList.add(klass);
    }
  }
    return el;
}


/////////////////////////////////
/////     Popout Editor     /////
/////////////////////////////////
var PopoutEditor = {
  /*  PopoutEditor allows quick editing of more complex elements.

    This is used for parts of the InsideISA email which require more input than
    simple text (eg. images, links, etc.).

    Attributes:
      $editor (HTML Element): The HTML Element containing the editor.
      $form (HTML Element): The HTML form contained within $editor.
      fields (Array of PopoutEditorField): The fields to be displayed as part
        of the PopoutEditor.
  */
  init: function() {
    // initializes the PopoutEditor by finding the editor on DOM.
    this.$editor = document.getElementById("popoutEditor");
    this.$form = this.$editor.getElementsByTagName('form')[0];
    this.$saveBtn = this.$form.querySelector('#popoutSave');
    this.fields = [];
    this.handler;
  },
  setup: function(fields, saveHandler) {
    // sets up the PopoutEditor for use.
    // fields is Array of PopoutEditorField
    // saveHandler is Function to be called when the save button is pressed.
    if (fields) {
      this.fields = fields;
    } else {
      this.fields = [];
    }
    for (let field of this.fields) {
      this.$form.insertBefore(field.insertLabel(), this.$saveBtn);
      this.$form.insertBefore(field.insertDiv(), this.$saveBtn);
    }

    if (saveHandler) {
      this.handler = saveHandler;
    } else {
      this.handler = undefined;
    }
  },
  display: function(xPos, yPos) {
    // $where (HTML element; req)
    // Takes an HTML element to use for display positioning. Displays the
    // PopoutEditor at the top right of the given element.
    this.$editor.style.top = yPos;
    this.$editor.style.left = xPos;

    this.$editor.classList.remove('hide');
  },
  hide: function() {
    this.$editor.classList.add('hide');
    for (let field of this.fields) {
      this.$form.removeChild(field.label);
      this.$form.removeChild(field.div.el);
    }
  }
}

var PopoutEditorField = {
  init: function(fieldName) {
    this.div = Object.create(InlineEditable);
    this.div.generateField('div', [], fieldName);
    this.div.id = fieldName
    this.label = document.createElement('label');
    this.label.setAttribute('for', fieldName);
    this.label.textContent = fieldName;
  },
  insertLabel: function($where) {
    if ($where && $where instanceof Element) {
        $where.append(this.label);
    } else {
      return this.label;
    }

  },
  insertDiv: function($where) {
    return this.div.renderEditable($where);
  }
}



var PopoutEditable = {
  // PopoutEditables are elements which have multiple fields of information
  // which must be supplied. These elements use the PopoutEditor to supply all
  // the pertinent information.
  init: function(tagName, placeholder, id, style, ctnKlass, outerCtn) {
    this.el = generateElement(tagName, [], id);
    this.el.setAttribute('style', style)
    if (tagName === 'img') {
      this.el.src = placeholder;
    } else {
      this.el.textContent = placeholder;
    }
    this.fields = [];

    this.editCtn = generateElement('a', [ctnKlass, 'popoutEdit']);
    this.editCtn.href = '#';
    var text = generateElement('div');
    text.textContent = 'edit';
    text.classList.add(ctnKlass + '__text')
    this.editCtn.append(text);
    this.outerCtn = outerCtn;
  },
  fields: [],
  insertFields: function($where) {
    // iterates through fields and renders them on the given HTML element ($where)
    for (let field of fields) {
      field.insertLabel($where);
      field.insertDiv($where);
    }
  },
  addField: function(fieldName) {
    // Creates and pushes a new PopoutEditorField to this.fields.
    var field = Object.create(PopoutEditorField);
    field.init(fieldName);
    this.fields.push(field);
  },
  addFields: function(fields) {
    for (let fieldName of fields) {
      var field = Object.create(PopoutEditorField);
      field.init(fieldName);
      this.fields.push(field);
    }
  },
  renderEditable: function($where, ctnKlass) {
    ctnKlasses = ['popoutEdit'];
    if (ctnKlass) {
      ctnKlasses.push(ctnKlass);
    }
    if (this.ctn) {
      this.ctn.append(this.el);
      var el = this.ctn;
    } else {
      var el = this.el;
    }
    this.editCtn.append(el);

    if ($where && $where instanceof Element) {
      $where.append(this.editCtn);
    } else {
      return editCtn;
    }
  },
  renderFinal: function($where) {
    if (this.ctn) {
      this.ctn.append(this.el);
      var el = this.ctn;
    } else {
      var el = this.el;
    }
    if ($where && $where instanceof Element) {
      $where.append(el);
    } else {
      return el;
    }
  },
  displayPopout: function() {
    var right = this.outerCtn.getBoundingClientRect();
    right = right.right + 25;
    var top = this.el.getBoundingClientRect();
    top = top.top + window.scrollY;
    PopoutEditor.setup(this.fields);
    PopoutEditor.display(right, top);
  }
}

var InlineEditable = {
  // InlineEditables are elements which can be editable in-place. They are
  // essentially elements with contenteditable set to true.
  generateField: function(tagName, klasses, id, placeholder, style) {
    // Creates an InlineEditable element with appropriate classes and attrs.
    if (!klasses) {
      klasses = [];
    }
    klasses.push('editable');
    this.el = generateElement(tagName, klasses, id);
    this.el.setAttribute('contenteditable', true);
    if (placeholder) {
      this.el.textContent = placeholder;
    }
    if (style) {
      this.el.setAttribute('style', style);
    }
  },
  insertOrReturnHTML: function($where) {
    if ($where && $where instanceof Element) {
      $where.append(this.el);
    } else {
      return this.el;
    }
  },
  renderEditable: function($where) {
    this.el.classList.add('editable');
    this.el.setAttribute('contenteditable', true);
    return this.insertOrReturnHTML($where);
  },
  renderFinal: function($where) {
    this.el.classList.remove('editable');
    this.el.removeAttribute('contenteditable');
    return this.insertOrReturnHTML($where);
  },
  value: function() {
    return this.el.textContent;
  }
}

var blank = Object.create(PopoutEditable);
var field = Object.create(PopoutEditorField);


ContentSection = {
  fields: {
    // contentType: 'blah', // InlineEditable
    // contentTitle: 'Blah', // InlineEditable
    // contentImage: Object.create(PopoutEditable),
    // contentBlurb: 'paragraph', // InlineEditable
    // contentLink: Object.create(PopoutEditable)
  },

  init: function(id) {
    // generates each field in fields as a placeholder.
    /*
      Arguments:
        id (Int): the integer to be used as this section's id.
    */
    id = Number(id);
    if (isNaN(id)) {
      return False;
    }
    this.id = id;
    this.idString = 'section' + String(this.id) + '_';
    this.createCtns();
    this.addInlineField('contentType', 'h2', PLACEHOLDER_TYPE, CONTENT_TYPE_STYLE);
    this.addInlineField('contentTitle', 'h1', PLACEHOLDER_TITLE, CONTENT_TITLE_STYLE);
    this.addImageField();
    this.addInlineField('contentBlurb', 'div', PLACEHOLDER_BLURB, CONTENT_BLURB_STYLE);
    this.addLinkField();

  },
  addInlineField: function(fieldName, tagName, placeholder, style) {
    this[fieldName] = Object.create(InlineEditable);
    this[fieldName].generateField(tagName, [], this.idString + fieldName, placeholder, style);
  },
  addPopoutField: function(fieldName, tagName, placeholder, popoutFields, style, ctnKlass) {
    this[fieldName] = Object.create(PopoutEditable);
    this[fieldName].init(tagName, placeholder, this.idString + fieldName, style, ctnKlass, this.ctn);
    this[fieldName].addFields(popoutFields);

  },
  addImageField: function() {
    this.addPopoutField('contentImage', 'img', PLACEHOLDER_IMG, CONTENT_IMG_FIELDS, CONTENT_IMG_STYLE, 'imgEdit');
    this.contentImage.saveHandler = function () {
      var urlField = this.fields.find(function (el) {el.div.id = 'URL'});
      var titleField = this.fields.find(function (el) {el.div.textContent;})
    }
  },
  addLinkField: function() {
    this.addPopoutField('contentLink', 'a', PLACEHOLDER_LINK, CONTENT_LINK_FIELDS, CONTENT_LINK_STYLE, 'linkEdit');
    var ctn = generateElement('div');
    ctn.setAttribute('style', CONTENT_LINK_CTN_STYLE);
    this['contentLink'].ctn = ctn;
  },
  createCtns: function() {
    this.ctn = document.createElement('tr');
    this.innerCtn = document.createElement('td');
    this.innerCtn.setAttribute('style', TD_CTN_STYLE);
    this.headingCtn = document.createElement('div');
    this.headingCtn.setAttribute('style', CONTENT_HEADING_CTN_STYLE);
    this.innerCtn.append(this.headingCtn);
    this.ctn.append(this.innerCtn);
  },
  renderEditable: function($where) {
    this.headingCtn.append(this.contentType.renderEditable());
    this.headingCtn.append(this.contentTitle.renderEditable());
    this.contentImage.renderEditable(this.innerCtn);
    this.contentBlurb.renderEditable(this.innerCtn);
    this.contentLink.renderEditable(this.innerCtn);
    return this.ctn;
  },
  renderFinal: function($where) {
    this.headingCtn.append(this.contentType.renderFinal());
    this.headingCtn.append(this.contentTitle.renderFinal());
    this.contentImage.renderFinal(this.innerCtn);
    this.contentBlurb.renderFinal(this.innerCtn);
    this.contentLink.renderFinal(this.innerCtn);
    return this.ctn;
  }

}

EmailGenerator = {
  container: document.getElementById('emailContent'), // The div containing the content to be pasted into GRS
  sections: {
    introduction: 'paragraph', // InlineEditable
    contentSections: [ContentSection] // Array of ContentSections
  },
  init: function() {
    // find the email container in the document, generate first content section,
    // get everything good to go.
  },

  copyToClipboard: function() {
    // Copy the content of the email to the clipboard for easy pasting into GRS.
  }
}






var imgEdit = document.getElementById('imgEdit0');
var linkEdit = document.getElementById('linkEdit0');
var editor = PopoutEditor;

var ctn = document.getElementById('contentSectionsCtn');
var bottomBtns = document.getElementById('bottomBtns');
var section = Object.create(ContentSection);
function setup() {
  section.init(0);
  PopoutEditor.init();
  PopoutEditor.setup(section.contentImage.fields);
  ctn.insertBefore(section.renderEditable(), bottomBtns);
}

function displayPopout() {
  var img = document.getElementById('section0_contentImage');
  PopoutEditor.display(img);
}
