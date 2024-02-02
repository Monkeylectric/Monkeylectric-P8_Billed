/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Si formulaire valide, verifier création
    test("Then bill must saved", () => {
      //to-do write assertion
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const html = NewBillUI();
      document.body.innerHTML = html;

      const billObject = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const newBillForm = screen.getByTestId("form-new-bill");
      expect(newBillForm).toBeTruthy();

      $.fn.modal = jest.fn();

      const handleClickSubmit = jest.fn((e) => 
        billObject.handleClickSubmit(e)
      );

      newBillForm.addEventListener("submit", handleClickSubmit);
      fireEvent.submit(newBillForm);
      expect(handleClickSubmit).toHaveBeenCalled();
    })

    test("Then the NewBill Page should be rendered", () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      
      router();

      window.onNavigate(ROUTES_PATH.NewBill);
    })

    test("Then verify the file bill", () => {
      jest.spyOn(mockStore, "bills")

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }      

      Object.defineProperty(window, "localStorage", { value: localStorageMock })

      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['NewBill']} })

      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))

      const html = NewBillUI()
      document.body.innerHTML = html

      const billObject = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const file = new File(['image'], 'image.png', { type: 'image/png' });

      $.fn.modal = jest.fn();

      const handleChangeFile = jest.fn((e) => billObject.handleChangeFile(e));

      const formNewBill = screen.getByTestId("form-new-bill");
      const billFile = screen.getByTestId('file');

      billFile.addEventListener("change", handleChangeFile);     
      userEvent.upload(billFile, file);
      
      expect(billFile.files[0].name).toBeDefined();
      expect(handleChangeFile).toBeCalled();
     
      const handleSubmit = jest.fn((e) => billObject.handleSubmit(e));
      formNewBill.addEventListener("submit", handleSubmit);     
      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
    })
  })

  describe("When I am on NewBill Page and submit the form", () => {
    test("Then it should generate a new bill", async () => {
      const createSpy = jest.spyOn(mockStore, "create");

      const newBill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl: "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Restauration",
        commentary: "Un petit McDo",
        name: "Hello",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 150,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20
      };

      const billCreated = await mockStore.create(newBill);

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(billCreated).toBe("New bill created");
    });
  });

})