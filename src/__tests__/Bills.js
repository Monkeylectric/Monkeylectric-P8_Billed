/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, waitFor, fireEvent } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toHaveClass("active-icon");
    })

    test("Then bills should be ordered from earliest to latest", () => {
      // START - add .map() with original date
      document.body.innerHTML = BillsUI({ data: bills.map((bill) => {
        return {...bill, originalDate: new Date(bill.date)};
      }) })
      // END - add .map with original date
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // Loading test
    test("Must show the loading before the bills lines", () => {
      const html = BillsUI({ loading: true });
      document.body.innerHTML = html;

      expect(screen.getAllByText("Loading...")).toBeTruthy();
    })

    // Error test
    test("Must show error", () => {
      const html = BillsUI({ error: "I am an error message" });
      document.body.innerHTML = html;
      
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  })

  describe('When I am on Bills Page and there are no bill', () => {
    test('Then bills should render an empty table', () => {
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      const eyeIcon = screen.queryByTestId('icon-eye');

      expect(eyeIcon).toBeNull();
    });
  });

  describe("When I click on an icon eye", () => {
    // Open modal test
    test("Then a modal should open", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))

      const billObject = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })

      document.body.innerHTML = BillsUI({ data: bills });
      const handleClickIconEye = jest.fn((icon) => billObject.handleClickIconEye(icon));
      const iconEye = screen.getAllByTestId("icon-eye");
      const modaleFile = document.getElementById("modaleFile");
      
      $.fn.modal = jest.fn(() => modaleFile.classList.add("show"));

      iconEye.forEach((icon) => {
        icon.addEventListener("click", handleClickIconEye(icon));
        userEvent.click(icon);
        expect(handleClickIconEye).toHaveBeenCalled();
      });

      expect(modaleFile).toHaveClass("show");
    })
  })

  // Quand je clique sur new bill - formulaire s'affiche
  describe("When I click on new bill", () => {
    // Check if form appear
    test("Then create bill form appear", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }));

      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const billObject = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const handleClickNewBill = jest.fn(() => billObject.handleClickNewBill ());

      const newBillButton = screen.getByTestId("btn-new-bill");

      newBillButton.addEventListener("click", handleClickNewBill);
      userEvent.click(newBillButton);

      expect(handleClickNewBill).toHaveBeenCalled();

      await waitFor(() => screen.getByTestId("form-new-bill"));

      // Check if new bill form exist
      const newBillForm = document.getElementById("form-new-bill");
      expect(newBillForm).toBeTruthy();
    })
  })

  describe("When I navigate to Bills Page", () => {
    test("Then the page is loaded", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, "localStorage", { value: localStorageMock })

      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))

      new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })    
      document.body.innerHTML = BillsUI({ data: bills });
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const expenseNote = screen.getByText("Mes notes de frais");
      expect(expenseNote).toBeTruthy();
    })
  })

  describe("When an API error occurs", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");

      Object.defineProperty(window, "localStorage", { value: localStorageMock })

      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
        email: "a@a"
      }))

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    })

    // bills fetch failure with 404 error
    test('Then fetch bills from an API and fails with 404 message error', async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })

      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;

      const message = await screen.getByText(/Erreur 404/);

      expect(message).toBeTruthy();
    })

    // bills fetch failure with 500 error
    test('Then fetch messages from an API and fails with 500 message error', async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })

      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;

      const message = await screen.getByText(/Erreur 500/);

      expect(message).toBeTruthy();
    })
  })

})

// Integration - UI DOM
// Unitaire - code