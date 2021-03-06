(function InitializeInsideISAEmailGenerator() {
  'use strict';

////////////////////////////////////
/////     STYLE CONSTANTS     //////
////////////////////////////////////
/*
  These constants are used for the inline-style on various pieces of the HTML
  email.
*/
const TD_CTN_STYLE = "border-bottom: 3px solid #ddd; position: relative;";
const CONTENT_TYPE_STYLE = "font-family: 'Helvetica', sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 20px; padding-top: 3px; padding-bottom: 3px; margin-top: 17px; color: #888;";
const CONTENT_TITLE_STYLE = "font-family: 'Helvetica', sans-serif; font-weight: normal; font-size: 24px; margin: 0; padding: 20px; padding-top: 3px; padding-bottom: 3px; margin-bottom: 17px; color: #333;";
const CONTENT_IMG_STYLE = "max-width: 100%;  text-align: center; margin-left: auto; margin-right: auto;";
const CONTENT_BLURB_STYLE = "margin:0;padding-top:7px;padding-bottom:7px;padding: 20px;";
const CONTENT_LINK_STYLE = "display: block; text-decoration: none; margin:0;padding-top:7px;padding-bottom:7px;;padding-left: 20px; padding-bottom: 20px; color: blue;";

//////////////////////////////////////
/////     TEXT PLACEHOLDERS     //////
//////////////////////////////////////
/*
  These are the default values for sections of the HTML email.
*/
const PLACEHOLDER_INTRO = "Enter your introduction here!";
const PLACEHOLDER_TYPE = "Content Type";
const PLACEHOLDER_TITLE = "Content Title";
const PLACEHOLDER_IMG = './.assets/images/placeholder.gif';
const PLACEHOLDER_IMG_ALT = "Placeholder Image. Click to edit.";
const PLACEHOLDER_BLURB = "This is the blurb";
const PLACEHOLDER_LINK = "Learn More";

//////////////////////////
/////     FIELDS     /////
//////////////////////////
/*
  These are the PopoutEditor fields for the image and link sections of the HTML
  email.
*/
const CONTENT_IMG_FIELDS = ['URL', 'Title', 'Alt Text'];
const CONTENT_LINK_FIELDS = ['URL', 'Text'];


/////////////////////////////
/////     UTILITIES     /////
/////////////////////////////
function generateElement(tagName, klasses, id) {
  /* Provides a simple function to create an element with classes and an id.*/
  if (!tagName) {
    return false;
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

function pasteAsPlainText(e) {
  /* Forces pasting as plain text */
  if (e.type !== 'paste') return false;
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertHTML', false, text);
  return true;
}

//////////////////////////
/////     Popout     /////
//////////////////////////
var Popout = {
  /* A generic pop-up box used for containing dynamic content.

  Attributes:
    $ctn (HTML element): the container which acts as the actual popup.
    popoutDefaultOffClickHandler (function): the default function called when
      a user clicks off this popout.
  */
  initPopout: function() {
    /* Initialize the popout. */
    this.$ctn = generateElement('div', ['popoutCtn', 'hide']);
    document.body.append(this.$ctn);
    this.replaceOffClickHandler(this.popoutDefaultOffClickHandler.bind(this));
    this.$ctn.addEventListener('paste', pasteAsPlainText.bind(this));
  },
  fillWithContent: function($content) {
    // fill $ctn with content.
    this.$ctn.append($content);
  },
  displayPopout: function(xPos, yPos) {
    // Displays the popout at given coorddinates.
    this.$ctn.style.top = yPos;
    this.$ctn.style.left = xPos;
    this.$ctn.classList.remove('hide');
    this.hidden = false;
  },
  displayAtElement($el, includeOffset) {
    /* Displays the Popout just next to the given element.

    Params:
      $el (HTML element): the HTML element next to which the Popout will be
        displayed.
      includeOffset (boolean): If true, the current Y scroll position will
        be included in the vertical position of the Popout. If false, it will
        not be included.
    */
    var rect = $el.getBoundingClientRect();
    var right = rect.right + 25;
    var offset;
    if (includeOffset) {
      offset = window.scrollY;
    } else {
      offset = 0;
    }
    var top = rect.top + offset;
    this.displayPopout(right, top);
  },
  hidePopout: function() {
    // while (this.$ctn.firstChild) {
    //   this.$ctn.removeChild(this.$ctn.firstChild);
    // }
    this.$ctn.classList.add('hide');
    this.hidden = true;
  },
  empty() {
    // removes all children from $ctn.
    while(this.$ctn.firstChild) {
      this.$ctn.removeChild(this.$ctn.firstChild);
    }
  },
  popoutDefaultOffClickHandler(e) {
    /* Auto-hide Popout if user clicks off.

    This is the default method for auto-hiding the Popout if a user
    clicks off the editor. If the user clicks on any element other than the
    current editable or the Popout, the Popout will be hidden and
    all changes will be lost.
   */
    if (!this.hidden && (!this.$ctn.contains(e.target))) {
      this.hidePopout();
    }
  },
  replaceOffClickHandler(handler) {
    if (this.offClickHandler) {
      document.removeEventListener('click', this.offClickHandler);
    }
    this.offClickHandler = handler;
    document.addEventListener('click', this.offClickHandler);
  }
};


/////////////////////////////////
/////     Popout Editor     /////
/////////////////////////////////
var PopoutEditor = {
  /*  PopoutEditor allows quick editing of more complex elements (img, a, etc).

    This is used for the image and link sections of the InsideISA email, which
    require more input from the user in order to properly be displayed. It uses
    the generic Popout as its prototype.

    Attributes:
      $form (HTML Element): The HTML form contained within $editor.
      fields (Array of PopoutEditorField): The fields to be displayed as part
        of the PopoutEditor.
      $saveBtn (HTML Element): The save (submit) button for $form.
      $cancelBtn (HTML Element): A button in $form that dismisses the
        PopoutEditor without saving the user's changes.
      fields (Array of PopoutEditorField): An Array of the fields that currently
        compose the PopoutEditor.
      saveHandler (function): The function to be called when the #saveBtn is
        clicked.
  */

  init() {
    /* Initialize the PopoutEditor

    This method initializes the PopoutEditor by finding its respective elements,
    ensures that its html elements are hidden, and attaching the appropriate
    event listeners to $form, $cancelBtn, and the document object.

    */
    this.proto = Object.getPrototypeOf(this);
    this.initPopout();
    this.generateForm();
    // this.$ctn.append(this.generateForm());
    this.$ctn.classList.add('popoutEditor');
    this.fields = [];
    this.hide();
    this.$form.addEventListener('submit', this.defaultHideHandler.bind(this));
    this.$cancelBtn.addEventListener('click', this.defaultHideHandler.bind(this));
    this.$form.addEventListener('keydown', this.keyDownHandler.bind(this));
    this.replaceOffClickHandler(this.defaultOffClickHandler.bind(this));
  },
  generateForm() {
    /* Generate the form and button elements for the PopoutEditor. */
    this.$form = generateElement('form');
    this.$saveBtn = generateElement('input', ['standardBtn'], 'popoutSave');
    this.$saveBtn.type = 'submit';
    this.$saveBtn.value = 'Save';
    this.$cancelBtn = generateElement('button', ['standardBtn'], 'popoutCancel');
    this.$cancelBtn.textContent = 'Cancel';
    this.$form.append(this.$saveBtn);
    this.$form.append(this.$cancelBtn);
    this.$ctn.append(this.$form);
    return this.$form;
  },
  setup(editable, saveHandler) {
    /* Sets up the PopoutEditor for use.

    This method differs from the init method in that it adds the appropriate
    fields and saveHandler to the PopoutEditor. The init method merely ensure
    the PopoutEditor exists and that it has the proper properties for use; setup
    actually gets it ready for use by the user.

    setup does five things:
      1. Iterate through and remove current fields, if applicable
      2. Resets current editable, if applicable. This ensures current editable
          no longer displays as active.
      3. Assigns PopoutEditor's editable to that passed. Makes this.fields point
          to new editable's fields.
      4. Renders fields into $form.
      5. Assigns the given saveHandler to be called on $form submit.

    Params:
      editable (PopoutEditable): the PopoutEditable which is being edited.
      saveHandler (Function): the function to call on $form submit.
    */
    for (let field of this.fields) {
      if (this.$form.contains(field.label)) {
        this.$form.removeChild(field.label);
      }
      if (this.$form.contains(field.field.el)) {
        this.$form.removeChild(field.field.el);
      }
    }
    if (this.editable) {
      this.editable.clickOffHandler();
    }
    if (editable) {
      this.editable = editable;
      if (this.editable.fields) {
        this.fields = this.editable.fields;
      } else {
        this.fields = [];
      }

    }
    for (let field of this.fields) {
      this.$form.insertBefore(field.insertOrReturnLabel(), this.$saveBtn);
      this.$form.insertBefore(field.insertOrReturnDiv(), this.$saveBtn);
    }
    if (saveHandler && typeof saveHandler === 'function') {
      this.saveHandler = saveHandler;
      this.$form.addEventListener('submit', this.saveHandler);
    } else {
      this.handler = undefined;
    }
  },
  hide() {
    /* Hide the PopoutEditor and remove the active state from the editable. */
    this.$ctn.classList.add('hide');
    this.hidden = true;
    if (this.editable) {
      this.editable.clickOffHandler();
    }
    this.$saveBtn.removeEventListener('submit', this.saveHandler);
    for (let field of this.fields) {
      this.$form.removeChild(field.label);
      this.$form.removeChild(field.field.el);
    }
    this.hidePopout();
  },
  defaultHideHandler(e) {
    /* This method provides default functionality for hiding the PopoutEditor. */
    e.preventDefault();
    this.hide();
  },
  defaultOffClickHandler(e) {
    /* Auto-hide PopoutEditor if user clicks off.

    This is the default method for auto-hiding the PopoutEditor if a user
    clicks off the editor. If the user clicks on any element other than the
    current editable or the PopoutEditor, the PopoutEditor will be hidden and
    all changes will be lost.
   */
    if (!this.hidden && (!this.$ctn.contains(e.target) && !this.editable.wasClicked(e))) {
      this.hide();
    }
  },
  display(xPos, yPos) {
    this.displayPopout(xPos, yPos);
  },
  keyDownHandler(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.$saveBtn.click();
    }
  },
};
Object.setPrototypeOf(PopoutEditor, Popout);

var InlineEditable = {
  /* InlineEditables are elements which can be editable in-place.

  One of two types of editables, InlineEdtiables can simply be clicked on and
  edited in place. They do not require the use of the PopoutEditor in order to
  be edited. In practice, they are essentially just divs with contenteditable
  set to true.

  Attributes:
    el (HTML element): The HTML element which will be displayed.
  */
  generateField: function(tagName, klasses, id, placeholder, style) {
    /* Generates the InlineEditable field.

    Params:
      tagName (String): the type of element to be used (typically div)
      klasses (Array of String): an Array of Strings to be added to el as
        classes.
      id (String): the id to be added to el
      placeholder (String): the text to be placed in the element by default.
      style (String): any inline style to be added to el. This is useful
        because this is an HTML email editor.
     */
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
  insertOrReturnHTML: function($where, $node) {
    /* Append the HTML for el to $where or simply return the HTML for el. */
    var node;
    if ($node && $node instanceof Element) {
      node = $node;
    } else {
      node = this.el;
    }
    if ($where && $where instanceof Element) {
      $where.append(node);
    } else {
      return node;
    }
  },
  renderEditable: function($where) {
    /* Renders the InlineEditable in an editable format. */
    this.el.classList.add('editable');
    this.el.setAttribute('contenteditable', true);
    return this.insertOrReturnHTML($where);
  },
  renderFinal: function($where) {
    /* Renders the InlineEditable in the final, non-editable format. */
    var dupNode = this.el.cloneNode(true);
    dupNode.classList.remove('editable');
    dupNode.removeAttribute('contenteditable');
    return this.insertOrReturnHTML($where, dupNode);
  },
  value: function() {
    /* Returns the value of the editable, similar to a form field. */
    return this.el.textContent;
  }
};

var PopoutEditorField = {
  /* Fields to be used in the PopoutEditor.

  A PopoutEditorField is composed of two elements: an HTML label element and an
  InlineEditable representing the editable div.

  Attributes:
    field (InlineEditable): the field is simply the editable div which users
      can use to input their data.
    label (HTML Element): The label is an HTML label element which describes the
      field.

  */
  init: function(fieldName) {
    /* Initializes the PopoutEditorField.

    Params:
      fieldName (String): the name to be used for the PopoutEditorField. This is
        displayed in the label and is used for the id of the InlineEditable div.
     */
    this.field = Object.create(InlineEditable);
    this.field.generateField('div', [], fieldName);
    this.field.id = fieldName;
    this.label = document.createElement('label');
    this.label.setAttribute('for', fieldName);
    this.label.textContent = fieldName;
  },
  insertOrReturnLabel: function($where) {
    /* Appends label to given HTML element $where or returns the label. */
    if ($where && $where instanceof Element) {
        $where.append(this.label);
    } else {
      return this.label;
    }

  },
  insertOrReturnDiv: function($where) {
    /* Appends field to given HTML element $where or returns the field as editable. */
    return this.field.renderEditable($where);
  },
  getValue: function() {
    /* Returns field's value. */
    return this.field.value();
  }
};

var PopoutEditable = {
  /* A field which requires more than one input value from the user.

  A PopoutEditable is a field which requires the user to input more than one
  value in order to be rendered in the final email. For now, this is only the
  image and link in each section. Because an image requires a src url, title,
  and alt text and because the link requires a url as well as reader-friendly
  text, the user must have a way to easily enter each of these fields. That's
  what the popoutEdditable does.

  A PopoutEditable is initialized as the desired HTML Element and given a set
  of fields for the values required for the user to edit said HTML Element.

  Attributes:
    el (HTML Element): The HTML element representing the final displayed version
      of the editable (eg. the <img> or <a> element).
    fields (Array of PopoutEditorField): The fields to present to the user to
      edit el.
    editCtn (HTML Element): The HTML element to be displayed as a wrapper around
      the final editable tag. This is done to allow for clear styling that the
      element can be edited.
    outerCtn: (HTML Element): The containing element. This is used only when
      displaying the PopoutEditor in order to appropriately position the editor.

  */
  init: function(tagName, placeholder, id, style, ctnKlass, outerCtn) {
    /* Initialize the PopoutEditable.

    Creates the desired element, adds appropriate placeholder, id, and style.
    Creates the editing container and adds the appropriate classes and click
    handlers in order to enable the PopoutEditor.

    Params:
      tagName (String): The tagname to use to create the element (eg. img).
      placeholder (String): The placeholder text (or image for img tags) to
        display as a default.
      id (String): The value to use as the id on this.el.
      style (String): The inline style to be added to this.el.
      ctnKlass (String): The class to add to this.editCtn. This is used to allow
        for custom styling for different types of editables (img vs. a).
      outerCtn (HTML Element): The containing element (eg. the ContentSection)
        to which this editable will belong.
    */
    this.el = generateElement(tagName, [], id);
    this.el.setAttribute('style', style);
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
    text.classList.add(ctnKlass + '__text');
    this.editCtn.append(text);
    this.outerCtn = outerCtn;

    this.editCtn.addEventListener('click', this.clickHandler.bind(this));
  },
  addFields: function(fields) {
    /* Adds given fields to the PopoutEditable.

    This method accepts either a single String or an Array of Strings
    representing the name of each field to be added. For each field provided
    a new PopoutEditorField is created and added to this.fields.

    Params:
      fields (Array of String || String): fields can either be a single String
        representing the title of each field or an Array of such Strings.

    */
    if (!Array.isArray(fields)) {
      fields = [fields];
    }
    for (let fieldName of fields) {
      var field = Object.create(PopoutEditorField);
      field.init(fieldName);
      this.fields.push(field);
    }
  },
  renderEditable: function($where) {
    /* Renders the PopoutEditable in an editable format wrapped in this.editCtn.

    Params:
      $where (HTML Element; opt): If provided, this is the HTML element to which
        the Editable will be attached.
    */
    this.editCtn.append(this.el);
    if ($where && $where instanceof Element) {
      $where.append(this.editCtn);
    } else {
      return this.editCtn;
    }
  },
  renderFinal: function($where) {
    /* Renders the PopoutEditable in its final, finished form.

    In order to maintain the editing screen while still being able to render the
    final element for copying, we must clone the node and remove its editCtn.

    Params:
      $where (HTML Element; opt): If provided, this is the HTML Element to which
        the final elemtn will be attached.

    */
    var el = this.el.cloneNode(true);
    if (this.ctn) {
      var ctn = this.ctn.cloneNode();
      ctn.append(el);
      el = ctn;
    }
    if ($where && $where instanceof Element) {
      $where.append(el);
    } else {
      return el;
    }
  },
  clickHandler: function(e) {
    /* Handler for when a user clicks on the Editable while editing.

    This handler prevents the default action (important for Editables that are
    links), adds the focused class to the editCtn, determines the display
    coordinates for the PopoutEditor then sets up and displays the PopoutEditor.
    */
    e.preventDefault();
    this.editCtn.classList.add('popoutEdit--focus');
    var right = this.outerCtn.getBoundingClientRect();
    right = right.right + 25;
    var top = this.el.getBoundingClientRect();
    top = top.top + window.scrollY;
    PopoutEditor.setup(this, this.saveHandler);
    PopoutEditor.display(right, top);
  },
  setSaveHandler: function(func) {
    // Sets the save handler to given function.
    if (typeof func === 'function'){
      this.saveHandler = func.bind(this);
    }
  },
  clickOffHandler: function() {
    // The function to handle when the user clicks off or out of editing this Editable.
    this.editCtn.classList.remove('popoutEdit--focus');
  },
  getValue: function(fieldName) {
    // Returns the value of the field with the given fieldName.
    var field = this.fields.find(function (el) {
      return el.field.id === fieldName;
    });
    return field.getValue();
  },
  wasClicked: function(e) {
    // when given an event, returns true if this Editable was the target.
    return this.editCtn.contains(e.target);
  }
};

var ContentSection = {
  /* The main modular component of the email.

  ContentSections are the main part of the InsideISA email. They encapsulate
  each piece of content the user would like toi include in the email.

  Attributes:
    id (Number): The numeric id for the ContentSection.
    parentGenerator (EmailGenerator): The EmailGenerator which owns this
      ContentSection.
    idString (String): The String representation of this ContentSection's id.
      This takes the form of "sectionN_" where 'N' is the id. This is used in
      creating the ids of the individual components of the ContentSection.
    placeholderStart (String): This is a similar idea to the idString except
      that it provides a reader-friendly format of the id. Takes the form of
      "SectionN " where 'N' is the id. This is used to display as a placeholder
      for new and empty ContentSections.
    fields (Array of Editable): This array contains all the Editable components
      of the ContentSection, both InlineEditable and PopoutEditable elements are
      contained.
  */
  init: function(id, parentGenerator) {
    // generates each field in fields as a placeholder.
    /* Initializes the ContentSection.

    Initializes the ContentSection by setting the id to the given value and
    generating the requisite id string/placeholder as well as the
    InlineEditables and PopoutEditables.

    Params:
      id (Int): the integer to be used as this section's id.
      parentGenerator (EmailGenerator): the EmailGenerator to which this
        ContentSection belongs.
    */
    id = Number(id);
    if (isNaN(id)) {
      return false;
    }
    this.id = id;
    this.parentGenerator = parentGenerator;
    this.idString = 'section' + String(this.id) + '_';
    this.placeholderStart = "Section " + this.id + " ";
    this.fields = [];
    this.createCtns();
    this.addInlineField('contentType', 'h2', this.placeholderStart + PLACEHOLDER_TYPE, CONTENT_TYPE_STYLE);
    this.addInlineField('contentTitle', 'h1', this.placeholderStart + PLACEHOLDER_TITLE, CONTENT_TITLE_STYLE);
    this.addImageField();
    this.addInlineField('contentBlurb', 'div', this.placeholderStart + PLACEHOLDER_BLURB, CONTENT_BLURB_STYLE);
    this.addLinkField();
    if (this.id !== 1) {
      this.generateDeleteBtn();
    }

  },
  addInlineField: function(fieldName, tagName, placeholder, style) {
    /* Creates an InlineEditable and attaches it to this ContentSection.

    Params
      fieldName (String): The name of the field. Used as the property name on
        this object as well as in the id for the InlineEditable.
      tagName (String): the type of HTML tag to create for the InlineEditable.
      placeholder (String): the placeholder text to be placed in the
        InlineEditable by default.
      style (String): the inline style to be added to the InlineEditable.
    */
    var field = Object.create(InlineEditable);
    field.generateField(tagName, [], this.idString + fieldName, placeholder, style);
    this.fields.push(field);
    return field;
  },
  addPopoutField: function(fieldName, tagName, placeholder, popoutFields, style, ctnKlass) {
    /* Creates a PopoutEditable and attaches it to this ContentSection.

    Params
      fieldName (String): The name of the field. Used as the property name on
        this object as well as in the id for the PopoutEditable.
        tagName (String): the type of HTML tag to create for the PopoutEditable.
        placeholder (String): the placeholder text to be placed in the
          InlineEditable by default.
        popoutFields (Array of String): the fields to be displayed when editing
          this PopoutEditable.
        style (String): the inline style to be added to the PopoutEditable.
        ctnKlass (String): the class to be added to the PopoutEditable's
          editCtn. This provides customizability in the appearance of each
          PopoutEditable (eg. img can look different than a link).

    */
    var field = Object.create(PopoutEditable);
    field.init(tagName, placeholder, this.idString + fieldName, style, ctnKlass, this.ctn);
    field.addFields(popoutFields);
    this.fields.push(field);
    return field;
  },
  addImageField: function() {
    /* Add the image field to this ContentSection.

    This method does two things:
      1. Call this ContentSection's addPopoutField method to create a
        PopoutEditable for the image.
      2. Set a saveHandler for the image PopoutEditable.
    */
    var field = this.addPopoutField('contentImage', 'img', PLACEHOLDER_IMG, CONTENT_IMG_FIELDS, CONTENT_IMG_STYLE, 'imgEdit');
    field.el.alt = PLACEHOLDER_IMG_ALT;
    field.setSaveHandler(function (e) {
      // This saveHandler simply sets the URL, Title, and Alt Attributes
      // for the image to those supplied by user in PopoutEditor.
      e.preventDefault();
      var url = this.getValue('URL');
      var title = this.getValue('Title');
      var alt = this.getValue('Alt Text');
      if (url) {
        this.el.src = url;
      }
      if (title) {
        this.el.title = title;
      }
      if (alt) {
        this.el.alt = alt;
      }
    });
  },
  addLinkField: function() {
    /* Add the link field to this ContentSection.

    This method does two things:
      1. Call this ContentSection's addPopoutField method to create a
        PopoutEditable for the link.
      2. Set a saveHandler for the link PopoutEditable.
    */
    var linkField = this.addPopoutField('contentLink', 'a', this.placeholderStart + PLACEHOLDER_LINK, CONTENT_LINK_FIELDS, CONTENT_LINK_STYLE, 'linkEdit');
    linkField.setSaveHandler(function (e) {
      // Sets href and text values for the link. Validates the given href to
      // ensure it specifies to use the http or https protocol in order to
      // ensure loading of the link.
      e.preventDefault();
      var href = this.getValue('URL');
      var text = this.getValue('Text');
      if (href) {
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          href = 'https://' + href;
        }
        this.el.href = href;
      }
      if (text) {
        this.el.textContent = text;
      }
    });
  },
  createCtns: function() {
    /* Renders the necessary containing elements for the email.

    Because of the format of the emails generated by ISA's in-house HTML email
    editor, we must wrap each content section in a <tr/> and <td/> element.
    */
    this.ctn = document.createElement('tr');
    this.innerCtn = document.createElement('td');
    this.innerCtn.setAttribute('style', TD_CTN_STYLE);
    this.ctn.append(this.innerCtn);
  },
  renderEditable: function($where) {
    // Renders the ContentSection as editable by calling each field's
    // renderEditable method.
    for (let field of this.fields) {
      field.renderEditable(this.innerCtn);
    }
    return this.ctn;
  },
  renderFinal: function($where) {
    // Clones the ctn and innerCtn in order to allow changes to remain
    // visible on the editing screen while still copying the code.
    // Iterates through each field in this.fields and calls its
    // renderFinal method.
    var ctn = this.ctn.cloneNode(false);
    var innerCtn = this.innerCtn.cloneNode(false);
    for (let field of this.fields) {
      field.renderFinal(innerCtn);
    }
    ctn.append(innerCtn);
    return ctn;
  },
  generateDeleteBtn: function() {
    // Generates the delete button on all ContentSections other than the
    // first.
    this.deleteBtn = generateElement('button', ['contentSection__deleteBtn', 'standardBtn'], this.idString + 'deleteBtn');
    this.deleteBtn.innerHTML = "&#215;";
    this.deleteBtn.setAttribute('title', 'Delete Section');
    this.deleteBtn.addEventListener('click', this.delete.bind(this));
    this.innerCtn.append(this.deleteBtn);
  },
  delete: function() {
    // Deletes this ContentSection (used by the delete btn)
    this.ctn.parentNode.removeChild(this.ctn);
    this.parentGenerator.deleteContentSection(this);
  }
};

var EmailGenerator = {
  /* The overall generator tool. Encompasses the entire email.

  The EmailGenerator encompasses the entire InsideISA email. From the
  intro section to each ContentSection, to the bottom buttons, this
  object contains it all and provides the broad functionality of the web
  app (add section, copy the code, etc).

  Attributes
    contentSections (Array of ContentSection): The ContentSections
      contained within the EmailGenerator.
    $contentSectionsCtn (HTML Element): The HTML element to act as the
      container for the rendered ContentSections.
    $bottomBtns (HTML Element): The HTML Element containing the buttons
      at the bottom of the $contentSectionsCtn. ContentSections are
      inserted before these buttons.
    $copyTarget (HTML Element): The target to which the final code will
      be briefly attached in order to allow it to copied to the
      clipboard.
  */
  init: function() {
    /* Initializes the EmailGenerator. */
    this.contentSections = [];
    this.$contentSectionsCtn = document.getElementById('contentSectionsCtn');
    this.$bottomBtns = document.getElementById('bottomBtns');
    this.$copyTarget = document.getElementById('copyTarget');
    this.createCopyPopout();
    this.generateIntroduction();
    this.generateSection(); // generate the first ContentSection
    this.$contentSectionsCtn.addEventListener('paste', pasteAsPlainText.bind(this));
  },
  generateIntroduction: function() {
    // Generates the introduction paragraph.
    this.introduction = Object.create(InlineEditable);
    this.introduction.generateField('p', [], 'introPara', PLACEHOLDER_INTRO);
    this.introduction.renderEditable(document.getElementById('introCtn'));
  },
  generateSection: function() {
    /* Generates a ContentSection.

    Because a ContentSection's id is seen by the user, we use a one-index
    instead of zero. Because ContentSections can be arbitrarily created
    and deleted, we always use the id of the last ContentSection in the
    array to determine the id for the new one. This causes a bit of
    hassle for finding ContentSections in the array as its id doesn't
    match up perfectly with its index, but it makes more sense to the
    user (they don't see Section 1, 4, 2). It also prevents any bugs
    when trying to create ContentSections with duplicate ids and indices
    (eg. create Section 1, 2, and 3; delete 2; create a new one--now
    Section 2 is after Section 3--then create another one--oops, two
    Section 3s.).

    */
    var section = Object.create(ContentSection);
    var sectionId;
    if (this.contentSections.length > 0) {
      sectionId = this.contentSections[this.contentSections.length-1].id + 1;
    } else {
      sectionId = 1;
    }
    section.init(sectionId, this);
    this.contentSections.push(section);
    this.$contentSectionsCtn.insertBefore(section.renderEditable(), this.$bottomBtns);
  },
  deleteContentSection: function(section) {
    // Deletes the given section from this.contentSections.
    var sectionIndex = this.contentSections.indexOf(section);
    this.contentSections.splice(sectionIndex, 1);
  },
  createCopyTextarea: function(content) {
    // Create and return a textarea with correct style filled with given content
    var copyTextarea = document.createElement('textarea');
    // copyTextarea.setAttribute('style', COPY_TEXTAREA_STYLE);
    copyTextarea.value = content;
    return copyTextarea;
  },
  createCopyPopout: function() {
    /* Create a Popout to contain and display HTML content from email.

    This method creates a new object linked to Popout. It also creates the
    needed elements and methods contained within.
    */
    if (!this.copyPopout) {
      this.copyPopout = Object.create(Popout);
      this.copyPopout.initPopout();
      this.copyPopout.$ctn.classList.add('copyPopout');
    }
    // Create message area
    this.copyPopout.$messageHeading = generateElement('h2');
    this.copyPopout.$message = generateElement('div');
    // Create button to close the Popout
    this.copyPopout.$copyBtn = generateElement('button', ['standardBtn']);
    this.copyPopout.$copyBtn.addEventListener('click', this.copyPopout.hidePopout.bind(this.copyPopout));
    this.copyPopout.$copyBtn.textContent = "Done";
    // Create the textarea element to which the HTML will be copied
    this.copyPopout.textArea = generateElement('textarea', ['copyTextarea']);

    // Insert the newly created elements in the Popout
    this.copyPopout.fillWithContent(this.copyPopout.$messageHeading);
    this.copyPopout.fillWithContent(this.copyPopout.$message);
    this.copyPopout.fillWithContent(this.copyPopout.textArea);
    this.copyPopout.fillWithContent(this.copyPopout.$copyBtn);
    // method for filling the textarea with content
    this.copyPopout.fillTextarea = function(content) {
      this.textArea.value = content;
    };
    // method for copying the content.
    this.copyPopout.copyContent = function() {
      /* Copy the contents of the textarea to clipboard and display a success message. */
      this.textArea.focus();
      this.textArea.select();
      var successful;
      try {
        successful = document.execCommand('copy');
      } catch (err) {
        successful = false;
      }
      if (successful) {
        this.$messageHeading.textContent = "Email content copied!";
        this.$message.textContent = "You can now paste the email content into GRS.";
      } else {
        this.$messageHeading.textContent = "Uh oh...";
        this.$message.textContent = "We couldn't copy the email content. Try again or manually copy the content below";
      }
      return successful;
    };
  },
  copyToClipboard: function($displayEl) {
    /* Copy the content of the email to the clipboard.

    In order to make the transferring of the InsideISA content to GRS as
    easy as possible, the contents are automatically copied to the user's
    clipboard. This takes some finagling but works pretty well.

    First, a copy of the copyTarget is made so that allowing the user to
    copy multiple times is a bit easier on our end (we can just throw
    away the copy of the copyTarget). The contents of the introduction
    and each ContentSection is then rendered and attached to the
    copyTarget.

    After this, a dummy TextArea HTML Element is temporarily created with
    style that effectively hides it from view. This allows us to paste
    the outerHTML of the copyTarget in an element which allows for
    focusing and selecting, allowing us to copy the code to the
    clipboard. The TextArea is then removed.
    */
    var copyTarget = this.$copyTarget.cloneNode(true);
    var contentCtn = copyTarget.querySelector('#copyTarget-contentSectionsCtn');
    var introCtn = copyTarget.querySelector('#copyTarget-introCtn');
    var bottomBtns = copyTarget.querySelector('#copyTarget-bottomBtns');

    introCtn.append(this.introduction.renderFinal());
    for (let contentSection of this.contentSections) {
      var sec = contentSection.renderFinal();
      contentCtn.insertBefore(sec, bottomBtns);
    }
    this.copyPopout.fillTextarea(copyTarget.outerHTML);
    this.copyPopout.displayAtElement($displayEl, false);
    this.copyPopout.copyContent();
  },
};

var Controller = {
  /* The controller/menu for controlling broad functions of the web app.

  The Controller contains several buttons which allow the user to operate
  on the generator itself. See below:

  Attributes:
    $copyCodeBtn (HTML Element): The button which allows users to copy
      the generated code to the clipboard.
    $addSectionBtn (HTML Element): The button which allows user to add a
      ContentSection to the EmailGenerator.
    $startOverBtn (HTML Element): Refreshes the page to discard all
      changes.
  */
  init: function() {
    this.$copyCodeBtn = document.getElementById('copyCodeBtn');
    this.$addSectionBtn = document.getElementById('addSectionBtn');
    this.$startOverBtn = document.getElementById('startoverBtn');

    this.$copyCodeBtn.addEventListener('click', this.copyCodeHandler.bind(this));
    this.$addSectionBtn.addEventListener('click', this.addSectionHandler.bind(this));
    this.$startOverBtn.addEventListener('click', this.startOverHandler.bind(this));
  },

  copyCodeHandler: function(e) {
    // click handler to copy code.
    e.preventDefault();
    // stop propogation to prevent automatically closing the Popout
    e.stopPropagation();
    EmailGenerator.copyToClipboard(e.target);
  },
  addSectionHandler: function(e) {
    // click handler to add a ContentSection.
    e.preventDefault();
    EmailGenerator.generateSection();
  },
  startOverHandler: function(e) {
    // click handler to refresh the page and start over.
    e.preventDefault();
    location.reload();
  }
};

document.addEventListener('DOMContentLoaded', function(e) {
  // Prep the web app when the page has loaded.
  EmailGenerator.init();
  PopoutEditor.init();
  Controller.init();
});
})();
